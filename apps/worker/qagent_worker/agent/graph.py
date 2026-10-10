from typing import Any

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from ..browser.survey import survey
from ..replay import replay
from ..security import url_allowed
from . import planner, reporter
from .executor import Deps, run_scenario
from .state import RunState

SCENARIO_FIELDS = ("title", "description", "kind", "expected")


def build_graph(deps: Deps) -> Any:
    async def save(run_id: str, planned: list[dict[str, Any]], traces: list[Any]) -> dict[str, Any]:
        ids = await deps.api.mutation("createScenarios", runId=run_id, scenarios=planned)
        await deps.api.mutation("setRunStatus", runId=run_id, status="running")
        return {
            "scenarios": [
                {**s, "_id": sid, "index": i, "trace": tr} for i, (s, sid, tr) in enumerate(zip(planned, ids, traces))
            ]
        }

    async def plan(state: RunState) -> dict[str, Any]:
        run = state.run
        if not await url_allowed(run["url"]):
            raise RuntimeError("This URL is not allowed (only public http/https sites can be tested)")
        if run.get("replayOf"):
            source = await deps.api.mutation("getReplay", runId=run["_id"])
            if source:
                planned = [{k: s[k] for k in SCENARIO_FIELDS} for s in source]
                return await save(run["_id"], planned, [s.get("trace") for s in source])
        context = await deps.pool.new_context()
        try:
            page = await context.new_page()
            try:
                await page.goto(run["url"], wait_until="domcontentloaded", timeout=20_000)
            except Exception as e:
                raise RuntimeError(f"Site unreachable: {str(e).splitlines()[0][:200]}") from e
            site = await survey(page, run["goal"])
        finally:
            await context.close()
        result = await planner.plan(run, site, deps.cost)
        return await save(run["_id"], [s.model_dump(include=set(SCENARIO_FIELDS)) for s in result.scenarios], [None] * len(result.scenarios))

    def fan_out(state: RunState) -> list[Send]:
        return [Send("execute_scenario", {"run": state.run, "scenarios": [s]}) for s in state.scenarios]

    async def execute_scenario(state: RunState | dict[str, Any]) -> dict[str, Any]:
        if isinstance(state, dict):
            state = RunState.model_validate(state)
        scenario = state.scenarios[0]
        async with deps.scenario_slots:
            result = await replay(deps, state.run, scenario) if scenario.get("trace") else None
            if result is None:
                result = await run_scenario(deps, state.run, scenario)
        return {"results": [result]}

    async def report(state: RunState) -> dict[str, Any]:
        run = state.run
        results = state.results
        await deps.api.mutation("setRunStatus", runId=run["_id"], status="reporting")
        if deps.cost.llmCalls == 0:
            n = len(results)
            text = f"{n} سناریو به‌صورت قطعی و بدون فراخوانی مدل بازپخش شد و همه موفق بودند. هزینه مدل: ۰ دلار."
        else:
            text = await reporter.summarize(run, state.scenarios, results, deps.cost)
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
