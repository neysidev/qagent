"""Live view: CDP screencast of a run's browser, served as an MJPEG stream while someone is watching."""

import asyncio
import base64
import hashlib
import hmac
import logging
import os

from playwright.async_api import CDPSession, Page

log = logging.getLogger("qagent.live")

SCREENCAST = {"format": "jpeg", "quality": 55, "maxWidth": 1280, "maxHeight": 800, "everyNthFrame": 1}


def token(run_id: str) -> str:
    """Per-run stream token; Convex mints the same HMAC for the run's owner."""
    return hmac.new(os.environ["WORKER_SECRET"].encode(), run_id.encode(), hashlib.sha256).hexdigest()[:32]


class Live:
    """One per run. Streams the oldest open page (parallel scenarios would otherwise flicker), only while viewed."""

    def __init__(self) -> None:
        self.pages: list[Page] = []
        self.viewers: set[asyncio.Queue[bytes | None]] = set()
        self.last: bytes | None = None
        self._page: Page | None = None
        self._cdp: CDPSession | None = None
        self._lock = asyncio.Lock()

    async def add_page(self, page: Page) -> None:
        self.pages.append(page)
        await self._sync()

    async def remove_page(self, page: Page) -> None:
        if page in self.pages:
            self.pages.remove(page)
        await self._sync()

    async def subscribe(self) -> asyncio.Queue[bytes | None]:
        q: asyncio.Queue[bytes | None] = asyncio.Queue(maxsize=1)
        if self.last:
            q.put_nowait(self.last)
        self.viewers.add(q)
        await self._sync()
        return q

    async def unsubscribe(self, q: asyncio.Queue[bytes | None]) -> None:
        self.viewers.discard(q)
        await self._sync()

    async def close(self) -> None:
        for q in self.viewers:
            self._push(q, None)
        self.viewers.clear()
        self.pages.clear()
        await self._sync()

    def _push(self, q: asyncio.Queue[bytes | None], frame: bytes | None) -> None:
        if q.full():
            q.get_nowait()  # slow viewer: drop the stale frame, keep the newest
        q.put_nowait(frame)

    async def _sync(self) -> None:
        async with self._lock:
            want = self.pages[0] if self.pages and self.viewers else None
            if want is self._page:
                return
            if self._cdp:
                try:
                    await self._cdp.send("Page.stopScreencast")
                    await self._cdp.detach()
                except Exception:
                    pass  # the page is already gone
            self._cdp = self._page = None
            if want is None:
                return
            try:
                cdp = await want.context.new_cdp_session(want)
                cdp.on("Page.screencastFrame", lambda p: self._frame(cdp, p))
                await cdp.send("Page.startScreencast", SCREENCAST)
                self._cdp, self._page = cdp, want
            except Exception:
                log.warning("screencast start failed", exc_info=True)

    def _frame(self, cdp: CDPSession, params: dict) -> None:
        self.last = base64.b64decode(params["data"])
        for q in self.viewers:
            self._push(q, self.last)
        asyncio.create_task(self._ack(cdp, params["sessionId"]))

    @staticmethod
    async def _ack(cdp: CDPSession, session_id: int) -> None:
        try:
            await cdp.send("Page.screencastFrameAck", {"sessionId": session_id})
        except Exception:
            pass


RUNS: dict[str, Live] = {}


def for_run(run_id: str) -> Live:
    return RUNS.setdefault(run_id, Live())


async def drop(run_id: str) -> None:
    live = RUNS.pop(run_id, None)
    if live:
        await live.close()


async def stream(run_id: str, reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
    """Writes the multipart MJPEG response until the viewer leaves or the run ends. Resends the last frame as keepalive."""
    live = for_run(run_id)
    q = await live.subscribe()
    gone = asyncio.create_task(reader.read(1))  # b"" once the client disconnects
    try:
        writer.write(
            b"HTTP/1.1 200 OK\r\nContent-Type: multipart/x-mixed-replace; boundary=frame\r\n"
            b"Cache-Control: no-store\r\nConnection: close\r\n\r\n"
        )
        while True:
            get = asyncio.create_task(q.get())
            await asyncio.wait({get, gone}, timeout=15, return_when=asyncio.FIRST_COMPLETED)
            if gone.done():
                get.cancel()
                break
            frame = get.result() if get.done() else live.last
            get.cancel()
            if frame is None:
                break
            writer.write(b"--frame\r\nContent-Type: image/jpeg\r\nContent-Length: %d\r\n\r\n" % len(frame) + frame + b"\r\n")
            await writer.drain()
    finally:
        gone.cancel()
        await live.unsubscribe(q)
