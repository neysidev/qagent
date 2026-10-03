from typing import Any

from ..llm import Cost, structured
from . import prompts
from .state import RunSummary, ScenarioResult


async def summarize(run: dict[str, Any], scenarios: list[dict[str, Any]], results: list[ScenarioResult], cost: Cost) -> str:
    lines = [f"- {scenarios[r.index]['title']}: {r.status} — {r.reason}" for r in sorted(results, key=lambda r: r.index)]
    user = f"Site: {run['url']}\nGoal: {run['goal']}\n\nScenario results:\n" + "\n".join(lines)
    try:
        res = await structured("fast", RunSummary, prompts.messages(prompts.REPORTER_SYSTEM, run["locale"], user), cost)
        return res.summary
    except Exception:
        return "\n".join(lines)  # the report must never fail the run
