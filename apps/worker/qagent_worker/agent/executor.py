"""Observe → decide → act loop for one scenario, in its own browser context."""

import asyncio
import logging
import random
import secrets as pysecrets
import time
from dataclasses import dataclass, field
from typing import Any, Protocol

from ..browser.actions import ActionError, execute
from ..browser.evidence import Evidence, screenshot
from ..browser.observe import Observation, observe
from ..browser.pool import VIEWPORT, BrowserPool
from ..llm import Cost, structured
from . import prompts, verifier
from .state import Action, Decision, ScenarioResult

log = logging.getLogger("qagent.executor")

MAX_STEPS = 25
SCENARIO_TIMEOUT_S = 180
HISTORY_LINES = 15


class Api(Protocol):
    async def mutation(self, name: str, **args: Any) -> Any: ...
    async def upload(self, data: bytes, content_type: str = "image/jpeg") -> str: ...


@dataclass
class Deps:
    api: Api
    pool: BrowserPool
    cost: Cost = field(default_factory=Cost)
    scenario_slots: asyncio.Semaphore = field(default_factory=lambda: asyncio.Semaphore(3))
    stop: asyncio.Event = field(default_factory=asyncio.Event)  # set when the user cancels the run


class StepWriter:
    """Uploads screenshots and writes steps in order, off the agent loop."""

    def __init__(self, api: Api, stop: asyncio.Event) -> None:
        self._api = api
        self._stop = stop
        self._queue: asyncio.Queue[tuple[bytes | None, dict[str, Any], asyncio.Future[str | None]]] = asyncio.Queue()
        self._task = asyncio.create_task(self._loop())

    def add(self, shot: bytes | None, step: dict[str, Any]) -> asyncio.Future[str | None]:
        fut: asyncio.Future[str | None] = asyncio.get_running_loop().create_future()
        self._queue.put_nowait((shot, step, fut))
        return fut

    async def _loop(self) -> None:
        while True:
            shot, step, fut = await self._queue.get()
            sid: str | None = None
            try:
                sid = await self._api.upload(shot) if shot else None
                res = await self._api.mutation("addStep", **step, **({"screenshotId": sid} if sid else {}))
                if res and res.get("stop"):
                    self._stop.set()
            except Exception:
                log.exception("step write failed")
            finally:
                if not fut.done():
                    fut.set_result(sid)
                self._queue.task_done()

    async def close(self) -> None:
        try:
            await asyncio.wait_for(self._queue.join(), timeout=30)
        finally:
            self._task.cancel()


def test_data() -> str:
    tag = pysecrets.token_hex(3)
    mobile = "09" + "".join(random.choices("0123456789", k=9))
    return (
        f"Name: Sara Ahmadi (سارا احمدی)\nEmail: qagent+{tag}@example.com\nMobile: {mobile}\n"
        f"Password for new accounts: Qa!{tag}Test9\nAddress: Tehran, Valiasr St, No. 12\n"
        "Invalid email for negative tests: abc@"
    )


def describe(action: Action) -> str:
    text = repr(action.text) if action.text is not None else None
    parts = (action.type, action.ref, text, action.key, action.url, action.direction, action.ms)
    return " ".join(str(p) for p in parts if p is not None)


def to_convex_action(action: Action) -> dict[str, str]:
    out = {"type": action.type}
    value = action.text if action.text is not None else action.direction or (str(action.ms) if action.ms else None)
    for k, v in (("ref", action.ref), ("value", value), ("url", action.url), ("key", action.key)):
        if v is not None:
            out[k] = v
    return out


def scrub(text: str, secret_values: list[str]) -> str:
    for s in secret_values:
        if s:
            text = text.replace(s, "****")
    return text


async def run_scenario(deps: Deps, run: dict[str, Any], scenario: dict[str, Any]) -> ScenarioResult:
    api, cost = deps.api, deps.cost
    creds = run.get("credentials") or {}
    secrets = {"username": creds.get("username", ""), "password": creds.get("password", "")}
    secret_values = [v for v in secrets.values() if v]
    data = test_data()
    if creds:
        data += "\nLogin username: {{username}}\nLogin password: {{password}}"

    await api.mutation("updateScenario", scenarioId=scenario["_id"], status="running")
    context = await deps.pool.new_context()
    writer = StepWriter(api, deps.stop)
    evidence = Evidence()
    history: list[str] = []
    step_shots: list[asyncio.Future[str | None]] = []
    conclusion: str | None = None
    finished_ok: bool | None = None
    limit_reason: str | None = None
    final_obs: Observation | None = None
    final_shot: bytes | None = None
    try:
        page = await context.new_page()
        evidence.attach(page)
        try:
            async with asyncio.timeout(SCENARIO_TIMEOUT_S):
                await page.goto(run["url"], wait_until="domcontentloaded", timeout=20_000)
                step = 0
                while finished_ok is None:
                    if step >= MAX_STEPS:
                        limit_reason = f"Step limit ({MAX_STEPS}) reached"
                        break
                    obs = await observe(page)
                    user = (
                        f"Scenario ({scenario['kind']}): {scenario['title']}\n{scenario['description']}\n"
                        f"Expected outcome: {scenario['expected']}\nOverall goal: {run['goal']}\n\n"
                        f"Test data:\n{data}\n\nSteps so far ({step}/{MAX_STEPS}):\n"
                        + ("\n".join(history[-HISTORY_LINES:]) or "(none)")
                        + f"\n\nCurrent page:\n{obs.render(secret_values)}"
                    )
                    decision = await structured(
                        "fast", Decision, prompts.messages(prompts.EXECUTOR_SYSTEM, run["locale"], user), cost
                    )
                    thought = scrub(decision.thought, secret_values)
                    if decision.done:
                        finished_ok, conclusion = decision.done.success, scrub(decision.done.reason, secret_values)
                        break
                    if not decision.actions:
                        history.append("(no action chosen)")
                        step += 1
                        continue
                    for i, action in enumerate(decision.actions[:4]):
                        if step >= MAX_STEPS:
                            break
                        target = None
                        if action.ref:
                            loc = page.locator(f'[data-qa-ref="{action.ref}"]').first
                            try:
                                box = await loc.bounding_box(timeout=1_000)
                            except Exception:
                                box = None
                            if box:
                                target = {
                                    "x": round(box["x"]), "y": round(box["y"]),
                                    "w": round(box["width"]), "h": round(box["height"]),
                                }
                        shot = await screenshot(page, action.ref)
                        url_before, started = page.url, time.monotonic()
                        ok, error = True, None
                        try:
                            await execute(page, action, obs, secrets)
                        except ActionError as e:
                            ok, error = False, scrub(str(e), secret_values)
                        step_shots.append(
                            writer.add(
                                shot,
                                {
                                    "runId": run["_id"], "scenarioId": scenario["_id"], "index": step,
                                    "action": to_convex_action(action), "thought": thought,
                                    "viewport": {"w": VIEWPORT["width"], "h": VIEWPORT["height"]},
                                    "pageUrl": url_before, "ok": ok,
                                    "durationMs": int((time.monotonic() - started) * 1000),
                                    **({"target": target} if target else {}),
                                    **({"error": error} if error else {}),
                                },
                            )
                        )
                        step += 1
                        history.append(f"{step}. {describe(action)} -> {'ok' if ok else 'FAILED: ' + (error or '')}")
                        if not ok or page.url != url_before:
                            break
                        nxt = decision.actions[i + 1] if i + 1 < len(decision.actions) else None
                        if nxt and nxt.ref and not await page.locator(f'[data-qa-ref="{nxt.ref}"]').count():
                            break  # page changed under us; re-observe
        except TimeoutError:
            limit_reason = f"Scenario time limit ({SCENARIO_TIMEOUT_S // 60} min) reached"
        except Exception as e:
            if not history:
                limit_reason = f"Site unreachable: {str(e).splitlines()[0][:200]}"
            else:
                limit_reason = f"Agent error: {str(e).splitlines()[0][:200]}"

        try:
            final_obs = await observe(page)
            final_shot = await screenshot(page)
        except Exception:
            pass
    finally:
        await context.close()
        await writer.close()

    if finished_ok is None:
        conclusion = f"The tester did not finish: {limit_reason}"
    else:
        conclusion = f"{'success' if finished_ok else 'FAILED'}: {conclusion}"

    verdict = await verifier.verify(
        run, scenario, history, conclusion, final_obs, final_shot, evidence, secret_values, cost
    )
    # An unfinished scenario can only end as a proven site bug or an agent error, never a pass.
    if verdict.status == "passed" and finished_ok is None:
        verdict.status, verdict.reason = "agent_error", limit_reason or verdict.reason

    if verdict.status == "failed" and verdict.bug:
        shot_ids = [f.result() for f in step_shots[-2:] if f.done() and f.result()]
        if final_shot:
            shot_ids.append(await api.upload(final_shot))
        await api.mutation(
            "addBug",
            runId=run["_id"], scenarioId=scenario["_id"],
            **{k: scrub(v, secret_values) if isinstance(v, str) else [scrub(x, secret_values) for x in v]
               for k, v in verdict.bug.model_dump().items() if k != "severity"},
            severity=verdict.bug.severity,
            evidence={
                "screenshotIds": shot_ids,
                "consoleErrors": evidence.console_errors[:10],
                "networkErrors": [e.model_dump() for e in evidence.network_errors[:10]],
            },
        )
    status = {"passed": "passed", "failed": "failed", "agent_error": "error"}[verdict.status]
    reason = scrub(verdict.reason, secret_values)
    await api.mutation("updateScenario", scenarioId=scenario["_id"], status=status, verdictReason=reason)
    return ScenarioResult(index=scenario["index"], status=status, reason=reason, bug=verdict.status == "failed")
