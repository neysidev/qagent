import base64
from typing import Any

from ..browser.evidence import Evidence
from ..browser.observe import Observation
from ..llm import Cost, model_name, structured
from . import prompts
from .state import Verdict

LOW_CONFIDENCE = 0.7


async def verify(
    run: dict[str, Any],
    scenario: dict[str, Any],
    history: list[str],
    agent_conclusion: str,
    final_obs: Observation | None,
    final_shot: bytes | None,
    evidence: Evidence,
    secrets: list[str],
    cost: Cost,
) -> Verdict:
    network = "\n".join(f"{e.method} {e.url} -> {e.status or 'failed'}" for e in evidence.network_errors) or "none"
    text = (
        f"Site: {run['url']}\nScenario ({scenario['kind']}): {scenario['title']}\n{scenario['description']}\n"
        f"Expected: {scenario['expected']}\n\nStep log:\n" + ("\n".join(history) or "(no steps)") +
        f"\n\nTester's conclusion: {agent_conclusion}\n\nConsole errors:\n" + ("\n".join(evidence.console_errors) or "none") +
        f"\n\nFailed network requests:\n{network}\n\nFinal page:\n" + (final_obs.render(secrets) if final_obs else "(unavailable)")
    )
    user = prompts.image_message(text, base64.b64encode(final_shot).decode()) if final_shot else text
    msgs = prompts.messages(prompts.VERIFIER_SYSTEM, user)

    verdict = await structured("fast", Verdict, msgs, cost)
    escalate = model_name("smart") != model_name("fast")
    if escalate and (verdict.status != "passed" or verdict.confidence < LOW_CONFIDENCE):
        verdict = await structured("smart", Verdict, msgs, cost)
    if verdict.status == "failed" and verdict.bug is None:
        verdict.status = "agent_error"
    return verdict
