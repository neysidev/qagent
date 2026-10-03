"""Pydantic models shared by the agent nodes (LLM schemas + graph state)."""

import operator
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field

ScenarioKind = Literal["happy", "negative", "edge"]
Severity = Literal["critical", "high", "medium", "low"]


class PlannedScenario(BaseModel):
    title: str = Field(description="Short scenario title")
    description: str = Field(description="What the tester will do, step by step, in 1-3 sentences")
    kind: ScenarioKind
    expected: str = Field(description="Observable expected outcome if the site works correctly")


class Plan(BaseModel):
    scenarios: list[PlannedScenario] = Field(min_length=1, max_length=5)


class Action(BaseModel):
    type: Literal["click", "fill", "select", "check", "press", "navigate", "scroll", "wait"]
    ref: str | None = Field(default=None, description="Element ref like e12 (click/fill/select/check)")
    text: str | None = Field(default=None, description="Text for fill, option for select")
    key: str | None = Field(default=None, description="Key for press, e.g. Enter")
    url: str | None = Field(default=None, description="Absolute URL for navigate (same site only)")
    direction: Literal["up", "down"] | None = None
    ms: int | None = Field(default=None, description="Milliseconds for wait, max 3000")


class Done(BaseModel):
    success: bool = Field(description="True if the scenario's expected outcome was observed")
    reason: str


class Decision(BaseModel):
    thought: str = Field(description="One or two short sentences of reasoning, in the requested language")
    actions: list[Action] = Field(default_factory=list, max_length=4)
    done: Done | None = Field(default=None, description="Set when the scenario is finished; then actions is empty")


class BugReport(BaseModel):
    title: str
    severity: Severity
    reproSteps: list[str]
    expected: str
    actual: str


class Verdict(BaseModel):
    status: Literal["passed", "failed", "agent_error"] = Field(
        description="passed: site behaved as expected. failed: the SITE is broken. "
        "agent_error: the tester got stuck or could not complete the steps; the site is not proven broken."
    )
    confidence: float = Field(ge=0, le=1)
    reason: str
    bug: BugReport | None = Field(default=None, description="Required when status is failed")


class RunSummary(BaseModel):
    summary: str = Field(description="2-4 sentence plain-language summary of the run for the site owner")


class ScenarioResult(BaseModel):
    index: int
    status: Literal["passed", "failed", "error"]
    reason: str
    bug: bool = False


class RunState(BaseModel):
    """LangGraph state. `run` is the claimed Convex run document."""

    run: dict[str, Any]
    scenarios: list[dict[str, Any]] = []  # PlannedScenario dumps + "_id"
    results: Annotated[list[ScenarioResult], operator.add] = []
