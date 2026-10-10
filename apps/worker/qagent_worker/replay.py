import logging
import re
import time
from typing import Any
from urllib.parse import urlsplit

from playwright.async_api import Page

from .agent.executor import Deps, StepWriter
from .agent.state import Action, ScenarioResult
from .browser.actions import ActionError, execute
from .browser.evidence import screenshot
from .browser.observe import observe
from .browser.pool import VIEWPORT

log = logging.getLogger("qagent.replay")
ELEMENT_ACTIONS = {"click", "fill", "select", "check"}


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


async def _resolve_ref(page: Page, raw: dict[str, Any], i: int) -> str | None:
    if raw.get("role") and raw.get("name"):
        loc = page.get_by_role(raw["role"], name=raw["name"]).first  # type: ignore[arg-type]
        try:
            if await loc.count():
                ref = await loc.get_attribute("data-qa-ref", timeout=2_000)
                if not ref:
                    ref = f"r{i}"
                    await loc.evaluate("(el, r) => { el.dataset.qaRef = r; }", ref)
                return ref
        except Exception:
            pass
    return raw.get("ref")


async def replay(deps: Deps, run: dict[str, Any], scenario: dict[str, Any]) -> ScenarioResult | None:
    trace = scenario.get("trace") or {}
    actions = trace.get("actions") or []
    if not actions:
        return None
    api = deps.api
    creds = run.get("credentials") or {}
    secrets = {"username": creds.get("username", ""), "password": creds.get("password", "")}

    await api.mutation("updateScenario", scenarioId=scenario["_id"], status="running")
    context = await deps.pool.new_context()
    writer = StepWriter(api, deps.stop)
    reproduced = False
    try:
        page = await context.new_page()
        await page.goto(run["url"], wait_until="domcontentloaded", timeout=20_000)
        for i, raw in enumerate(actions):
            obs = await observe(page)
            action = Action.model_validate({k: raw[k] for k in Action.model_fields if k in raw})
            action.ref = await _resolve_ref(page, raw, i) if action.type in ELEMENT_ACTIONS else None
            target = None
            if action.ref:
                try:
                    box = await page.locator(f'[data-qa-ref="{action.ref}"]').first.bounding_box(timeout=1_000)
                except Exception:
                    box = None
                if box:
                    target = {"x": round(box["x"]), "y": round(box["y"]), "w": round(box["width"]), "h": round(box["height"])}
            shot = await screenshot(page, action.ref)
            url_before, started = page.url, time.monotonic()
            error = None
            try:
                await execute(page, action, obs, secrets)
            except ActionError as e:
                error = str(e)
            writer.add(
                shot,
                {
                    "runId": run["_id"], "scenarioId": scenario["_id"], "index": i,
                    "action": {k: v for k, v in {"type": action.type, "ref": action.ref, "value": action.text,
                                                  "url": action.url, "key": action.key}.items() if v is not None},
                    "thought": f"بازپخش مرحله {i + 1} بدون مدل",
                    "viewport": {"w": VIEWPORT["width"], "h": VIEWPORT["height"]},
                    "pageUrl": url_before, "ok": error is None,
                    "durationMs": int((time.monotonic() - started) * 1000),
                    **({"target": target} if target else {}),
                    **({"error": error} if error else {}),
                },
            )
            if error:
                log.info("replay of %s broke at step %d: %s", scenario["_id"], i + 1, error)
                return None
        checks = trace.get("checks") or {}
        body = _norm(await page.inner_text("body"))
        reproduced = urlsplit(page.url).path == checks.get("path", urlsplit(page.url).path) and all(
            _norm(t) in body for t in checks.get("texts", [])
        )
    except Exception as e:
        log.info("replay of %s failed: %s", scenario["_id"], str(e)[:200])
        return None
    finally:
        await context.close()
        await writer.close()

    if not reproduced:
        return None
    reason = "به‌صورت قطعی بازپخش شد و همان نتیجه موفق تکرار شد (بدون هزینه مدل)."
    await api.mutation(
        "updateScenario", scenarioId=scenario["_id"], status="passed", verdictReason=reason, replayed=True, trace=trace
    )
    return ScenarioResult(index=scenario["index"], status="passed", reason=reason, replayed=True)
