"""Worker entry: claim loop, concurrency cap, heartbeat; each run executes the LangGraph agent."""

import asyncio
import hmac
import json
import logging
import os
import socket
import time
from typing import Any
from urllib.parse import parse_qsl, urlsplit

from .agent.executor import Deps
from .agent.graph import build_graph
from .agent.state import RunState
from .browser import live
from .browser.pool import BrowserPool
from .convex_api import ConvexApi
from .llm import error_code

log = logging.getLogger("qagent")

WORKER_ID = os.environ.get("WORKER_ID") or socket.gethostname()
MAX_CONCURRENT_RUNS = int(os.environ.get("MAX_CONCURRENT_RUNS", "2"))
SCENARIO_PARALLELISM = int(os.environ.get("SCENARIO_PARALLELISM", "3"))
LIVE_URL = os.environ.get("LIVE_URL", "").rstrip("/")  # public https URL of this worker's port, for the live view
POLL_INTERVAL_S = 1.0
HEARTBEAT_INTERVAL_S = 15.0


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, Any] = {
            "ts": round(record.created, 3),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
            "worker": WORKER_ID,
        }
        if record.exc_info:
            entry["exc"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False)


async def start_health_server(running: set[asyncio.Task[None]]) -> None:
    """GET /health → 200 JSON (Railway healthcheck). Up only once the browser is warm."""
    started = time.time()

    async def handle(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        try:
            line = await asyncio.wait_for(reader.readline(), timeout=5)
            path = urlsplit(line.split(b" ")[1].decode()) if line.count(b" ") >= 2 else urlsplit("")
            parts = path.path.split("/")
            if parts[:2] == ["", "live"] and len(parts) == 3 and hmac.compare_digest(
                dict(parse_qsl(path.query)).get("token", ""), live.token(parts[2])
            ):
                await live.stream(parts[2], reader, writer)
                return
            ok = path.path == "/health"
            body = json.dumps({"ok": True, "worker": WORKER_ID, "runs": len(running), "uptime": int(time.time() - started)})
            status = "200 OK" if ok else "404 Not Found"
            writer.write(
                f"HTTP/1.1 {status}\r\nContent-Type: application/json\r\nContent-Length: {len(body)}\r\n"
                f"Connection: close\r\n\r\n{body}".encode()
            )
            await writer.drain()
        except Exception:
            pass
        finally:
            writer.close()

    port = int(os.environ.get("PORT", "8080"))
    await asyncio.start_server(handle, "0.0.0.0", port)
    log.info("health endpoint on :%d/health", port)


async def heartbeat(api: ConvexApi, run_id: str, deps: Deps, task: asyncio.Task[None]) -> None:
    while not task.done():
        await asyncio.sleep(HEARTBEAT_INTERVAL_S)
        try:
            res = await api.mutation("heartbeat", runId=run_id, workerId=WORKER_ID, cost=deps.cost.model_dump())
            if res and res.get("stop"):
                deps.stop.set()
        except Exception:
            log.exception("run %s: heartbeat failed", run_id)


async def execute(deps: Deps, run: dict[str, Any]) -> None:
    await build_graph(deps).ainvoke(RunState(run=run))


async def handle(api: ConvexApi, pool: BrowserPool, run: dict[str, Any], slots: asyncio.Semaphore) -> None:
    run_id = run["_id"]
    deps = Deps(api=api, pool=pool, scenario_slots=asyncio.Semaphore(SCENARIO_PARALLELISM))
    task = asyncio.create_task(execute(deps, run))
    hb = asyncio.create_task(heartbeat(api, run_id, deps, task))

    async def stop_watcher() -> None:
        await deps.stop.wait()
        log.info("run %s: stop requested", run_id)
        task.cancel()

    watcher = asyncio.create_task(stop_watcher())
    try:
        await task
        log.info("run %s: done", run_id)
    except asyncio.CancelledError:
        log.info("run %s: canceled", run_id)
    except Exception as e:
        log.exception("run %s: failed", run_id)
        try:
            await api.mutation(
                "finishRun", runId=run_id, status="failed", error=_run_error(e), cost=deps.cost.model_dump()
            )
        except Exception:
            log.exception("run %s: could not mark failed", run_id)
    finally:
        hb.cancel()
        watcher.cancel()
        await live.drop(run_id)
        slots.release()


def _run_error(e: BaseException) -> str:
    """Run error as stored: "CODE: detail" for known provider failures (the app maps CODE), raw text otherwise."""
    code = error_code(e)
    return (f"{code}: {e}" if code else str(e))[:500]


async def main() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    logging.basicConfig(level=logging.INFO, handlers=[handler])
    api = ConvexApi()
    pool = BrowserPool()
    await pool.start()
    slots = asyncio.Semaphore(MAX_CONCURRENT_RUNS)
    running: set[asyncio.Task[None]] = set()
    await start_health_server(running)
    log.info("worker %s ready (max %d runs)", WORKER_ID, MAX_CONCURRENT_RUNS)
    try:
        while True:
            await slots.acquire()
            try:
                run = await api.mutation("claimNextRun", workerId=WORKER_ID, **({"liveUrl": LIVE_URL} if LIVE_URL else {}))
            except Exception:
                log.exception("claim failed")
                run = None
            if not run:
                slots.release()
                await asyncio.sleep(POLL_INTERVAL_S)
                continue
            log.info("run %s: claimed %s", run["_id"], run["url"])
            t = asyncio.create_task(handle(api, pool, run, slots))
            running.add(t)
            t.add_done_callback(running.discard)
    finally:
        await pool.stop()


if __name__ == "__main__":
    asyncio.run(main())
