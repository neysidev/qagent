"""LangGraph: plan → fan-out execute_scenario (execute + verify, max N parallel) → report."""

from typing import Any

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from ..browser.observe import observe
from ..security import url_allowed
from . import planner, reporter
from .executor import Deps, run_scenario
from .state import RunState


def build_graph(deps: Deps) -> Any:
    async def plan(state: RunState) -> dict[str, Any]:
        run = state.run
        if not await url_allowed(run["url"]):
            raise RuntimeError("This URL is not allowed (only public http/https sites can be tested)")
        context = await deps.pool.new_context()
        try:
            page = await context.new_page()
            try:
                await page.goto(run["url"], wait_until="domcontentloaded", timeout=20_000)
            except Exception as e:
                raise RuntimeError(f"Site unreachable: {str(e).splitlines()[0][:200]}") from e
            obs = await observe(page)
        finally:
            await context.close()
        result = await planner.plan(run, obs, deps.cost)
        planned = [s.model_dump() for s in result.scenarios]
        ids = await deps.api.mutation("createScenarios", runId=run["_id"], scenarios=planned)
        await deps.api.mutation("setRunStatus", runId=run["_id"], status="running")
        return {"scenarios": [{**s, "_id": sid, "index": i} for i, (s, sid) in enumerate(zip(planned, ids))]}

    def fan_out(state: RunState) -> list[Send]:
        return [Send("execute_scenario", {"run": state.run, "scenarios": [s]}) for s in state.scenarios]

    async def execute_scenario(state: RunState | dict[str, Any]) -> dict[str, Any]:
        if isinstance(state, dict):  # Send payloads may arrive uncoerced
            state = RunState.model_validate(state)
        async with deps.scenario_slots:
            result = await run_scenario(deps, state.run, state.scenarios[0])
        return {"results": [result]}

    async def report(state: RunState) -> dict[str, Any]:
        run = state.run
        await deps.api.mutation("setRunStatus", runId=run["_id"], status="reporting")
        text = await reporter.summarize(run, state.scenarios, state.results, deps.cost)
        results = state.results
        await deps.api.mutation(
            "finishRun",
            runId=run["_id"],
            status="done",
            summaryText=text,
            summary={
                "total": len(results),
                "passed": sum(r.status == "passed" for r in results),
                "failed": sum(r.status == "failed" for r in results),
                "bugs": sum(r.bug for r in results),
            },
            cost=deps.cost.model_dump(),
        )
        return {}

    g = StateGraph(RunState)
    g.add_node("plan", plan)
    g.add_node("execute_scenario", execute_scenario)
    g.add_node("report", report)
    g.add_edge(START, "plan")
    g.add_conditional_edges("plan", fan_out, ["execute_scenario"])
    g.add_edge("execute_scenario", "report")
    g.add_edge("report", END)
    return g.compile()
