import base64
from typing import Any

from ..browser.evidence import Evidence
from ..browser.observe import Observation
from ..llm import Cost, model_name, structured
from . import prompts
from .state import Verdict

LOW_CONFIDENCE = 0.7


def quick_verdict(
    finished_ok: bool | None, final_obs: Observation | None, evidence: Evidence, passed_asserts: int = 0
) -> Verdict | None:
    clean = not evidence.console_errors and not evidence.network_errors
    invalid = any(e.invalid for e in final_obs.elements) if final_obs else False
    if finished_ok is None and clean:
        return Verdict(status="agent_error", confidence=0.9, reason="The tester did not finish and the site showed no errors.")
    if finished_ok and clean and not invalid and passed_asserts:
        return Verdict(status="passed", confidence=0.9, reason="Expected outcome confirmed by a passing deterministic check, with no console errors, failed requests or invalid fields.")
    return None


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
    finished_ok: bool | None = None,
    asserts: list[str] | None = None,
) -> Verdict:
    asserts = asserts or []
    quick = quick_verdict(finished_ok, final_obs, evidence, sum(a.startswith('PASS') for a in asserts))
    if quick:
        return quick
    network = "\n".join(f"{e.method} {e.url} -> {e.status or 'failed'}" for e in evidence.network_errors) or "none"
    text = (
        f"Site: {run['url']}\nScenario ({scenario['kind']}): {scenario['title']}\n{scenario['description']}\n"
        f"Expected: {scenario['expected']}\n\nStep log:\n" + ("\n".join(history) or "(no steps)") +
        f"\n\nAssertions:\n" + ("\n".join(asserts) or "none") + f"\n\nTester's conclusion: {agent_conclusion}\n\nConsole errors:\n" + ("\n".join(evidence.console_errors) or "none") +
        f"\n\nFailed network requests:\n{network}\n\nFinal page:\n" + (final_obs.render(secrets) if final_obs else "(unavailable)")
    )
    user = prompts.image_message(text, base64.b64encode(final_shot).decode()) if final_shot else text
    msgs = prompts.messages(prompts.VERIFIER_SYSTEM, user)

    verdict = await structured("fast", Verdict, msgs, cost)
    escalate = model_name("smart") != model_name("fast")
    if escalate and (verdict.status == "failed" or verdict.confidence < LOW_CONFIDENCE):
        verdict = await structured("smart", Verdict, prompts.messages(prompts.VERIFIER_SYSTEM, text), cost)
    if verdict.status == "failed" and verdict.bug is None:
        verdict.status = "agent_error"
    return verdict
