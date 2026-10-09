from typing import Any

from ..browser.observe import Observation
from ..llm import Cost, structured
from . import prompts
from .state import Plan


async def plan(run: dict[str, Any], obs: Observation, cost: Cost) -> Plan:
    creds = "Test credentials are provided (use them to log in)." if run.get("credentials") else "No test credentials."
    template = f"Template: {run['templateKey']}\n" if run.get("templateKey") else ""
    user = (
        f"Start URL: {run['url']}\nGoal: {run['goal']}\n{template}{creds}\n\n"
        f"First observation of the start page:\n{obs.render([])}"
    )
    result = await structured("fast", Plan, prompts.messages(prompts.PLANNER_SYSTEM, user), cost)
    result.scenarios = result.scenarios[:5]
    return result
