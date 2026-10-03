"""Worker entry: claim loop, concurrency cap, heartbeat. Phase 1 agent = open URL, 1 screenshot, done."""

import asyncio
import logging
import os
import socket
import time
from typing import Any

from .browser.pool import VIEWPORT, BrowserPool
from .convex_api import ConvexApi

log = logging.getLogger("qagent")

WORKER_ID = os.environ.get("WORKER_ID") or socket.gethostname()
MAX_CONCURRENT_RUNS = int(os.environ.get("MAX_CONCURRENT_RUNS", "2"))
POLL_INTERVAL_S = 1.0
HEARTBEAT_INTERVAL_S = 15.0


async def heartbeat(api: ConvexApi, run_id: str, task: asyncio.Task[None]) -> None:
    while not task.done():
        await asyncio.sleep(HEARTBEAT_INTERVAL_S)
        try:
            res = await api.mutation("heartbeat", runId=run_id, workerId=WORKER_ID)
            if res and res.get("stop"):
                log.info("run %s: stop requested", run_id)
                task.cancel()
        except Exception:
            log.exception("run %s: heartbeat failed", run_id)


async def execute(api: ConvexApi, pool: BrowserPool, run: dict[str, Any]) -> None:
    run_id = run["_id"]
    await api.mutation("setRunStatus", runId=run_id, status="running")
    [scenario_id] = await api.mutation(
        "createScenarios",
        runId=run_id,
        scenarios=[
            {"title": "Open the site", "description": "Load the start URL.", "kind": "happy", "expected": "The page loads."}
        ],
    )
    await api.mutation("updateScenario", scenarioId=scenario_id, status="running")

    context = await pool.new_context()
    started = time.monotonic()
    ok, error = True, None
    try:
        page = await context.new_page()
        try:
            await page.goto(run["url"], wait_until="domcontentloaded", timeout=20_000)
        except Exception as e:  # still screenshot whatever rendered
            ok, error = False, str(e)[:500]
        shot = await page.screenshot(type="jpeg", quality=60)
        screenshot_id = await api.upload(shot)
        thought = "در حال باز کردن سایت" if run["locale"] == "fa" else "Opening the site"
        await api.mutation(
            "addStep",
            runId=run_id,
            scenarioId=scenario_id,
            index=0,
            action={"type": "navigate", "url": run["url"]},
            thought=thought,
            viewport={"w": VIEWPORT["width"], "h": VIEWPORT["height"]},
            pageUrl=page.url,
            screenshotId=screenshot_id,
            ok=ok,
            durationMs=int((time.monotonic() - started) * 1000),
            **({"error": error} if error else {}),
        )
    finally:
        await context.close()

    await api.mutation(
        "updateScenario", scenarioId=scenario_id, status="passed" if ok else "error", verdictReason=error or "Page loaded"
    )
    await api.mutation(
        "finishRun",
        runId=run_id,
        status="done",
        summary={"total": 1, "passed": int(ok), "failed": 0, "bugs": 0},
        cost={"inputTokens": 0, "outputTokens": 0, "usd": 0, "llmCalls": 0},
    )


async def handle(api: ConvexApi, pool: BrowserPool, run: dict[str, Any], slots: asyncio.Semaphore) -> None:
    run_id = run["_id"]
    task = asyncio.create_task(execute(api, pool, run))
    hb = asyncio.create_task(heartbeat(api, run_id, task))
    try:
        await task
        log.info("run %s: done", run_id)
    except asyncio.CancelledError:
        log.info("run %s: canceled", run_id)
    except Exception as e:
        log.exception("run %s: failed", run_id)
        try:
            await api.mutation("finishRun", runId=run_id, status="failed", error=str(e)[:500])
        except Exception:
            log.exception("run %s: could not mark failed", run_id)
    finally:
        hb.cancel()
        slots.release()


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    api = ConvexApi()
    pool = BrowserPool()
    await pool.start()
    slots = asyncio.Semaphore(MAX_CONCURRENT_RUNS)
    running: set[asyncio.Task[None]] = set()
    log.info("worker %s ready (max %d runs)", WORKER_ID, MAX_CONCURRENT_RUNS)
    try:
        while True:
            await slots.acquire()
            try:
                run = await api.mutation("claimNextRun", workerId=WORKER_ID)
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
