# 1. Product access

## Deployed URL

| Component | URL | Status |
|---|---|---|
| Web app (Vercel project `qagent-web`) | https://qagent-web.vercel.app | **Verified** 2026-10-10: landing page and `/signin` return HTTP 200 with the QAgent (کیوایجنت) title |
| Backend (Convex) | Production `.convex.cloud` deployment | **Unverified** from outside; the web app depends on it for sign-in and data |
| Agent worker (Railway) | Internal, no public page except `GET /health` | **Unverified**: deployment status, region and URL not confirmed |

> If a custom domain is used for the submission, replace the URL above and set `NEXT_PUBLIC_SITE_URL` on Vercel so
> share links, the sitemap and OG images use it (`apps/web/lib/site.ts`).

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
- **Email features** (send report, weekly digest) need `RESEND_API_KEY` and `EMAIL_FROM` on Convex; unknown whether set in production.

## Verification checklist

Not yet done end to end on production. Creating accounts on the live site was intentionally not automated for this
document. Before submitting, run through:

- [ ] Sign up with a new email on https://qagent-web.vercel.app/signin
- [ ] Start a run on a public site you own or are allowed to test
- [ ] First screenshot appears within ~10 s (worker online, model key valid)
- [ ] Run reaches `done` with a summary and at least one scenario verdict
- [ ] Open the share link in a private window
- [ ] Export one format (e.g. PDF or Markdown)
- [ ] Re-run: passed scenarios show as replayed with $0.00 LLM cost
- [ ] Record the actual time and cost of the run for [02-technical.md](02-technical.md#costs)

If any step fails, record it here under **Known gaps** rather than describing it as working.

## Known gaps

- End-to-end production run: **unverified** (see checklist).
- Billing: pricing is shown on the landing page, but there is no payment flow; every account is on the free quota.
