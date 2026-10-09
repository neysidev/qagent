"""One warm Chromium per worker; a fresh, guarded context per scenario."""

from urllib.parse import urlsplit

from playwright.async_api import Browser, BrowserContext, Playwright, Route, async_playwright

from ..security import url_allowed

VIEWPORT = {"width": 1280, "height": 800}
BLOCKED_TYPES = {"font", "media"}
BLOCKED_DOMAINS = (
    "google-analytics.com", "googletagmanager.com", "doubleclick.net", "googlesyndication.com", "facebook.net",
    "hotjar.com", "clarity.ms", "segment.io", "mixpanel.com", "mc.yandex.ru", "yandex.ru/metrika", "sentry.io",
)


async def _guard(route: Route) -> None:
    req = route.request
    host = urlsplit(req.url).hostname or ""
    if req.resource_type in BLOCKED_TYPES or any(host == d or host.endswith("." + d) for d in BLOCKED_DOMAINS):
        await route.abort("blockedbyclient")
    elif not await url_allowed(req.url):
        await route.abort("addressunreachable")
    else:
        await route.continue_()


class BrowserPool:
    def __init__(self) -> None:
        self._pw: Playwright | None = None
        self._browser: Browser | None = None

    async def start(self) -> None:
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(args=["--disable-dev-shm-usage"])

    async def new_context(self) -> BrowserContext:
        assert self._browser, "BrowserPool.start() not called"
        context = await self._browser.new_context(viewport=VIEWPORT, ignore_https_errors=True, locale="fa-IR")
        context.set_default_timeout(20_000)
        await context.route("**/*", _guard)
        return context

    async def stop(self) -> None:
        if self._browser:
            await self._browser.close()
        if self._pw:
            await self._pw.stop()
