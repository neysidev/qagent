from typing import Any

from ..llm import Cost, structured
from . import prompts
from .state import Plan


async def plan(run: dict[str, Any], survey: str, cost: Cost) -> Plan:
    creds = "Test credentials are provided (use them to log in)." if run.get("credentials") else "No test credentials."
    template = f"Template: {run['templateKey']}\n" if run.get("templateKey") else ""
    user = (
        f"Start URL: {run['url']}\nGoal: {run['goal']}\n{template}{creds}\n\n"
        f"Site survey (what the site really has, read from the live pages):\n{survey}"
    )
    result = await structured("fast", Plan, prompts.messages(prompts.PLANNER_SYSTEM, user), cost)
    result.scenarios = result.scenarios[:5]
    return result
