"""Execute one agent action on the page. Targets by data-qa-ref, falls back to role/text."""

from urllib.parse import urljoin, urlsplit

from playwright.async_api import Locator, Page

from ..agent.state import Action
from ..security import url_allowed
from .observe import Observation

ACTION_TIMEOUT_MS = 20_000


class ActionError(Exception):
    pass


async def _locate(page: Page, action: Action, obs: Observation) -> Locator:
    loc = page.locator(f'[data-qa-ref="{action.ref}"]')
    if await loc.count():
        return loc.first
    el = obs.by_ref(action.ref)
    if el and el.name:
        for fallback in (page.get_by_role(el.aria_role, name=el.name), page.get_by_text(el.name, exact=True)):  # type: ignore[arg-type]
            if await fallback.count():
                return fallback.first
    raise ActionError(f"Element {action.ref} not found")


async def _settle(page: Page) -> None:
    try:
        await page.wait_for_load_state("domcontentloaded", timeout=5_000)
        await page.wait_for_load_state("networkidle", timeout=1_500)
    except Exception:
        pass


async def execute(page: Page, action: Action, obs: Observation, secrets: dict[str, str]) -> None:
    def resolve(text: str | None) -> str:
        text = text or ""
        for key, value in secrets.items():
            text = text.replace("{{" + key + "}}", value)
        return text

    t = action.type
    try:
        if t == "navigate":
            target = urljoin(page.url, action.url or "")
            if urlsplit(target).hostname != urlsplit(page.url).hostname or not await url_allowed(target):
                raise ActionError("Navigation outside the target site is not allowed")
            await page.goto(target, wait_until="domcontentloaded", timeout=ACTION_TIMEOUT_MS)
        elif t == "press":
            await page.keyboard.press(action.key or "Enter")
        elif t == "scroll":
            await page.mouse.wheel(0, -600 if action.direction == "up" else 600)
        elif t == "wait":
            await page.wait_for_timeout(min(max(action.ms or 1000, 0), 3000))
        else:
            loc = await _locate(page, action, obs)
            if t == "click":
                await loc.click(timeout=ACTION_TIMEOUT_MS)
            elif t == "fill":
                await loc.fill(resolve(action.text), timeout=ACTION_TIMEOUT_MS)
            elif t == "select":
                try:
                    await loc.select_option(value=resolve(action.text), timeout=5_000)
                except Exception:
                    await loc.select_option(label=resolve(action.text), timeout=ACTION_TIMEOUT_MS)
            elif t == "check":
                await loc.check(timeout=ACTION_TIMEOUT_MS)
    except ActionError:
        raise
    except Exception as e:
        raise ActionError(str(e).split("\n")[0][:300]) from e
    await _settle(page)
