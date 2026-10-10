# QAgent

AI agent that tests web user flows like a real user and reports what broke.

```
apps/web        Next.js app (Vercel, root dir = apps/web)
apps/worker     Python agent worker (Railway, Docker)
convex/         Convex schema + functions (deployed from apps/web, see apps/web/convex.json)
```

## Local setup

```bash
pnpm install
cd apps/web && npx convex dev          # creates the deployment, writes .env.local, keeps functions synced
npx @convex-dev/auth                   # once: sets JWT_PRIVATE_KEY, JWKS, SITE_URL on the deployment
npx convex env set WORKER_SECRET <random>
pnpm dev:web                           # http://localhost:3000
```

Worker (Python 3.12):

```bash
cd apps/worker
python3.12 -m venv .venv && . .venv/bin/activate
pip install -e . && playwright install chromium
CONVEX_URL=... WORKER_SECRET=... GOOGLE_API_KEY=... python -m qagent_worker.main
```

## Env vars

See `.env.example` (Convex), `apps/web/.env.example`, `apps/worker/.env.example`.

## Deploy

1. **Convex:** create a production deployment in the dashboard; set `WORKER_SECRET`, `DAILY_RUN_LIMIT`, and run `npx @convex-dev/auth --prod` (sets `SITE_URL` to the Vercel URL + JWT keys). Copy a production deploy key.
2. **Web (Vercel):** import the repo, Root Directory `apps/web`. Env: `CONVEX_DEPLOY_KEY`. `vercel.json` runs `npx convex deploy --cmd 'pnpm build'`, which also sets `NEXT_PUBLIC_CONVEX_URL`.
3. **Worker (Railway):** new service from the repo, Root Directory `apps/worker` (uses `Dockerfile`), EU region. Env: `CONVEX_URL` (the `.convex.cloud` URL), `WORKER_SECRET`, `WORKER_ID`, `MAX_CONCURRENT_RUNS`.

## Agent

`apps/worker/qagent_worker/agent/graph.py`: plan → fan-out `execute_scenario` (observe → decide → act loop, then
verify; max `SCENARIO_PARALLELISM` in parallel) → report. Fast model for planning/acting/verifying, smart model only
to re-check failed or low-confidence verdicts. Every LLM call is costed into `run.cost`. Requests to private/loopback/
metadata addresses are blocked on every request (`security.py`).

## Re-runs and replay

"Re-run" replays every previously passed scenario deterministically (role + accessible name selectors, no LLM).
If a replay step or end-state check fails, that scenario falls back to the agent. Failed scenarios always re-run
with the agent.

## Operations

- Worker logs are JSON lines on stdout. `GET /health` on `$PORT` (default 8080) is the Railway healthcheck.
- LLM 429/5xx/timeouts: up to 5 attempts with backoff, then fallback to the other model.
- Docs: `docs/submission/` (product access, technical, business plan, investor pitch).

## Acceptance checks

- Sign up on the web URL → create a project with a public site URL and start a run → a screenshot appears on the run page within ~10s.
- Wrong secret rejected: `CONVEX_URL=... python apps/worker/tests/test_secret.py`
- Kill the worker mid-run: within ~2 min the cron (`convex/crons.ts`) re-queues it (1 retry), then marks it `failed`.
