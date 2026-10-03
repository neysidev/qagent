"""Benchmark the agent against the demo shop, in-process (no Convex needed).

    DEMO_SHOP_URL=https://<demo-shop> GOOGLE_API_KEY=... python -m tests.benchmark
    (for a local shop: DEMO_SHOP_URL=http://localhost:3001 ALLOW_PRIVATE_URLS=1)

Prints detection rate (bugs=all), false positives (bugs=none), average duration and cost.
"""

import asyncio
import os
import re
import time
from itertools import count
from typing import Any

from qagent_worker.agent.executor import Deps
from qagent_worker.agent.graph import build_graph
from qagent_worker.agent.state import RunState
from qagent_worker.browser.pool import BrowserPool

GOALS: list[tuple[str, set[str]]] = [
    ("Add a product to the cart, change its quantity, then remove it from the cart", {"B1", "B3"}),
    ("Sign up for a new account, and check that invalid email addresses are rejected", {"B2"}),
    ("Send a message using the contact form and make sure it is really sent", {"B4"}),
    ("Create an account, then log in with the same email typed with uppercase letters", {"B5"}),
]
MATCHERS = {
    "B1": r"remov|delet|حذف|500",
    "B2": r"email|ایمیل",
    "B3": r"quantit|negative|zero|تعداد|منفی|صفر",
    "B4": r"contact|message|console|تماس|پیام",
    "B5": r"log ?in|case|upper|ورود|بزرگ",
}


class MemoryApi:
    def __init__(self) -> None:
        self.bugs: list[dict[str, Any]] = []
        self.finished: dict[str, Any] = {}
        self._ids = count()

    async def mutation(self, name: str, **args: Any) -> Any:
        if name == "createScenarios":
            return [f"s{next(self._ids)}" for _ in args["scenarios"]]
        if name == "addBug":
            self.bugs.append(args)
        if name == "finishRun":
            self.finished = args
        return None

    async def upload(self, data: bytes, content_type: str = "image/jpeg") -> str:
        return f"file{next(self._ids)}"


async def one_run(pool: BrowserPool, url: str, goal: str) -> tuple[MemoryApi, float, float]:
    api = MemoryApi()
    deps = Deps(api=api, pool=pool, scenario_slots=asyncio.Semaphore(int(os.environ.get("SCENARIO_PARALLELISM", "3"))))
    run = {"_id": "run", "url": url, "goal": goal, "locale": "en"}
    started = time.monotonic()
    await build_graph(deps).ainvoke(RunState(run=run))
    return api, time.monotonic() - started, deps.cost.usd


async def main() -> None:
    base = os.environ.get("DEMO_SHOP_URL", "http://localhost:3001").rstrip("/")
    pool = BrowserPool()
    await pool.start()
    detected: set[str] = set()
    false_positives = 0
    durations: list[float] = []
    costs: list[float] = []
    try:
        for goal, expected in GOALS:
            for mode in ("all", "none"):
                try:
                    api, secs, usd = await one_run(pool, f"{base}/?bugs={mode}", goal)
                except Exception as e:
                    print(f"[{mode}] {goal}\n  CRASH: {e}")
                    continue
                durations.append(secs)
                costs.append(usd)
                titles = [f"{b['title']} {b['actual']}" for b in api.bugs]
                if mode == "all":
                    hits = {b for b in expected if any(re.search(MATCHERS[b], t, re.I) for t in titles)}
                    detected |= hits
                else:
                    false_positives += len(api.bugs)
                print(f"[{mode}] {goal}\n  {secs:.0f}s ${usd:.4f} bugs: {[b['title'] for b in api.bugs]}")
    finally:
        await pool.stop()

    total = sum(len(e) for _, e in GOALS)
    print("\n=== Benchmark ===")
    print(f"Detection: {len(detected)}/{total} {sorted(detected)}")
    print(f"False positives (bugs=none): {false_positives}")
    if durations:
        print(f"Avg duration: {sum(durations) / len(durations):.1f}s  Avg cost: ${sum(costs) / len(costs):.4f}")


if __name__ == "__main__":
    asyncio.run(main())
