"""One warm Chromium per worker; a fresh context per scenario."""

from playwright.async_api import Browser, BrowserContext, Playwright, async_playwright

VIEWPORT = {"width": 1280, "height": 800}


class BrowserPool:
    def __init__(self) -> None:
        self._pw: Playwright | None = None
        self._browser: Browser | None = None

    async def start(self) -> None:
        self._pw = await async_playwright().start()
        self._browser = await self._pw.chromium.launch(args=["--disable-dev-shm-usage"])

    async def new_context(self) -> BrowserContext:
        assert self._browser, "BrowserPool.start() not called"
        return await self._browser.new_context(viewport=VIEWPORT, ignore_https_errors=True)

    async def stop(self) -> None:
        if self._browser:
            await self._browser.close()
        if self._pw:
            await self._pw.stop()
