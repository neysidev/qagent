# 1. Product access

## Deployed URL

| Component | Where | Role |
|---|---|---|
| Web app (Vercel) | https://qagent-web.vercel.app | Landing, sign-up / sign-in, dashboard, reports |
| Backend (Convex) | Production `.convex.cloud` deployment | Auth, data, run queue, realtime updates |
| Agent worker (Railway) | Internal service, health check at `GET /health` | Runs the AI agent and the Chromium browser |

No demo account is provided. Reviewers create their own account; no email verification is required.

## User journey

The UI is Persian (RTL). Each step below maps to a route in `apps/web/app`.

| Step | Route | What happens |
|---|---|---|
| 1. Landing | `/` | Product overview, how it works, pricing. Call-to-action opens sign-in. |
| 2. Register / log in | `/signin` | Email + password (Convex Auth `Password` provider). Same page toggles between sign-up and sign-in. |
| 3. Dashboard | `/dashboard` | Composer: enter a site URL and a test goal in plain Persian. Optional test account (username/password) for flows behind login. Recent runs and projects are listed. A banner warns when no worker is online. |
| 4. Run starts | `/runs/[id]` | Status moves `queued → planning → running → reporting → done`. Planned scenarios (2–5, at least one happy path and one negative/edge case) appear. Each step shows the agent's thought, the action, and a screenshot; a live browser stream is shown when the worker exposes `LIVE_URL`. Live time and LLM cost update in place. The user can cancel. |
| 5. Final result | `/runs/[id]` | Summary text, pass/fail counts, cost. Each bug has severity, expected vs actual, reproduction steps, screenshots, console errors and failed network requests. "Agent stuck" verdicts are labeled separately from site bugs. |
| 6. Act on the result | `/runs/[id]` | Share a public read-only link (`/share/[token]`), export (PDF, HTML, Markdown, JSON, JUnit XML, CSV), email the report, create an issue in GitHub / Linear / Jira, re-run (passed scenarios replay with no LLM calls), compare against a previous run (`/runs/[id]/compare`). |
| 7. Other pages | `/projects/[id]`, `/notifications`, `/settings` | Run history per site; notifications; Slack / Telegram / webhook alerts, weekly email digest, white-label brand name and logo for reports. |

### Limits a reviewer may hit

- **Daily quota:** `DAILY_RUN_LIMIT` runs per user per 24 h (default 10). Exceeding it shows an error in the composer.
- **Targets:** only public `http(s)` sites. Localhost and private IPs are rejected by the worker.
- **Captcha, OTP and email verification** on the target site stop a scenario and are reported as "blocked", not as bugs.
- **No worker online:** runs stay `queued`; after 10 minutes with no worker they fail with "No worker available".

## Quick test for reviewers

1. Open https://qagent-web.vercel.app/signin and create an account with any email and password.
2. On the dashboard, enter a public site URL and a goal in Persian, for example a search or sign-up flow.
3. Watch the run live: planned scenarios, each step with the agent's reasoning and a screenshot.
4. Read the final report: summary, pass/fail per scenario, bugs with severity, repro steps and evidence.
5. Optional: open the share link in a private window, export a PDF, or press re-run to see passed scenarios replay with $0 model cost.

A run is expected to take about 2–4 minutes.

## Current limits

- Billing: pricing is shown on the landing page, but there is no payment flow; every account is on the free quota.
