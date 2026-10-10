from playwright.async_api import Page, Request, Response
from pydantic import BaseModel

_IGNORED_FAILURES = ("ERR_BLOCKED_BY_CLIENT", "ERR_ABORTED")


class NetworkError(BaseModel):
    method: str
    url: str
    status: int


class Evidence(BaseModel):
    console_errors: list[str] = []
    network_errors: list[NetworkError] = []

    def attach(self, page: Page) -> None:
        page.on("console", lambda m: m.type == "error" and self._console(m.text))
        page.on("pageerror", lambda e: self._console(f"Uncaught {e.name}: {e.message}"))
        page.on("response", self._response)
        page.on("requestfailed", self._failed)

    def _console(self, text: str) -> None:
        if len(self.console_errors) < 30:
            self.console_errors.append(text[:500])

    def _response(self, res: Response) -> None:
        if res.status >= 400 and len(self.network_errors) < 30:
            self.network_errors.append(NetworkError(method=res.request.method, url=res.url[:300], status=res.status))

    def _failed(self, req: Request) -> None:
        if any(code in (req.failure or "") for code in _IGNORED_FAILURES) or len(self.network_errors) >= 30:
            return
        self.network_errors.append(NetworkError(method=req.method, url=req.url[:300], status=0))


_HIGHLIGHT_ON = "el => { el.dataset.qaOutline = el.style.outline; el.style.outline = '3px solid #f43f5e'; }"
_HIGHLIGHT_OFF = "el => { el.style.outline = el.dataset.qaOutline || ''; delete el.dataset.qaOutline; }"


async def screenshot(page: Page, ref: str | None = None) -> bytes:
    loc = page.locator(f'[data-qa-ref="{ref}"]').first if ref else None
    if loc is not None:
        try:
            await loc.scroll_into_view_if_needed(timeout=1_000)
            await loc.evaluate(_HIGHLIGHT_ON, timeout=1_000)
        except Exception:
            loc = None
    try:
        return await page.screenshot(type="jpeg", quality=60, timeout=10_000)
    finally:
        if loc is not None:
            try:
                await loc.evaluate(_HIGHLIGHT_OFF, timeout=1_000)
            except Exception:
                pass
