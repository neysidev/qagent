# 3. Business plan

Labels: **Fact** = backed by the product or code. **Assumption** / **Estimate** = hypothesis to validate.
**Illustrative** / **Proposal** = a scenario for planning, not a forecast or a commitment.

## Problem

Small teams — startups, web agencies, online shops — ship changes without dedicated QA. Bugs in sign-up, login,
cart and checkout are found by customers, which costs sales and trust. Scripted test tools (Selenium, Cypress,
Playwright) need engineers to write and maintain tests; manual QA is slow, inconsistent and leaves no evidence trail.
*(Assumption: problem framing from founder experience; validate with customer interviews.)*

## Target market

| Segment | Why | Status |
|---|---|---|
| Iranian startups and online shops (WooCommerce, custom stacks) with no QA role | Product is Persian / RTL, tests public flows without code | Assumption |
| Web agencies | One account covers many client sites; white-label reports exist | Assumption |
| Any Persian-speaking small team | Natural-language goals in Persian | Assumption |

### Market size

| Layer | Figure | Basis |
|---|---|---|
| TAM — global AI test automation | **$8.8B (2025) → $36B (2032), 22.3% CAGR** | MarketsandMarkets [1] |
| Iranian online businesses | **~50,000** live sites showing the eNamad trust seal | BuiltWith tracker [2]; ~39,000 new seals issued in H1 1402 (2023) [3] |
| SAM — Iranian online businesses that ship site changes regularly | **~10,000 businesses ≈ $5.2M/yr** | Assumption: 20% of the 50k; × $516 blended ARPU (see projections) |
| SOM — 36-month target | **600 paying accounts ≈ $310k ARR** | 6% of SAM; see projections |

eNamad counts are a proxy: some sites display the seal without a license, and BuiltWith includes some non-Iranian
sites. Agencies and startups without a shop are not in this count, so the proxy is likely an undercount for those segments.

[1] https://www.marketsandmarkets.com/blog/ICT/ai-test-automation-market
[2] https://trends.builtwith.com/widgets/e-Namad
[3] https://intellinews.com/iran-registers-75-rise-in-e-commerce-transactions-301031

## Value proposition

"Tell QAgent what to check. It uses your site like a real user and tells you exactly what broke, where, and why."

| Benefit | Backed by (Fact) |
|---|---|
| No code | Goal in plain Persian + URL; agent plans 2–5 scenarios itself |
| Evidence, not guesses | Severity, repro steps, screenshots, console and network errors per bug |
| Honest verdicts | Verifier separates "site broken" from "agent stuck" |
| Watchable | Live step-by-step view and optional browser stream |
| Cheap re-runs | Passed flows replay deterministically with $0 LLM cost and fall back to the agent when the UI changes |
| Fits existing workflow | Share links, PDF/HTML/Markdown/JSON/JUnit/CSV export, GitHub/Linear/Jira issues, Slack/Telegram/webhook alerts |
| Local fit | Persian RTL UI and reports, toman pricing |

## Competitors and differentiation

| Alternative | Gap QAgent targets |
|---|---|
| Mabl, Testim | Enterprise pricing and onboarding; no Persian / RTL |
| QA Wolf | Managed service built for larger teams |
| Momentic, Octomind and other AI testing tools | English-first; no local payment |
| Selenium / Cypress / Playwright scripts | Need engineers to write and maintain |
| Manual QA / freelancers | Slow, inconsistent, no evidence trail |

Competitor positioning is based on public product descriptions and should be re-checked before presenting
(**Assumption**). Differentiation: Persian natural language, no code, RTL reports, self-healing replay, free entry tier.

## Revenue model

Subscription by run volume, as shown on the landing page (**Fact**: copy in `apps/web/messages/fa.json`):

| Plan | Monthly | Yearly (per month) | Includes |
|---|---|---|---|
| Free | 0 toman | 0 toman | 10 runs/day, live view, shareable reports |
| Pro | 990k toman | 825k toman | 300 runs/month, test account login flows, self-healing re-runs, priority queue |
| Agency | 3.5M toman | 2.9M toman | 1,500 runs/month, unlimited projects, white-label reports, all Pro features |

**Not implemented yet:** payment gateway, plan upgrades, monthly quotas, priority queue. Today every user gets the
free daily quota (`DAILY_RUN_LIMIT`). Prices are **assumptions** until tested with paying users. USD equivalents
were used in earlier drafts ($29 / $99); confirm before using them for non-Iranian customers.

Next revenue levers (**recommendations**): scheduled monitoring with alerts, CI/GitHub integration, per-seat team plans.

## Major costs

| Cost | Driver | Status |
|---|---|---|
| LLM usage | **~$0.22 per agent run** (estimate), $0 per replayed run | Mechanism is Fact; amount is an estimate ([03](02-technical.md#costs)) |
| Hosting (Vercel, Convex, Railway, Resend) | **$20–85 / month** fixed at MVP | Estimate |
| Payment processing | ~1–3% of revenue | Assumption |
| Team | Founder only today; hires per the funding plan below | Plan |

### Unit economics

Prices in USD use the earlier equivalents ($29 Pro, $99 Agency); the toman prices must be re-converted at the
current rate. LLM cost per agent run is the $0.22 estimate.

| Scenario | Pro: LLM cost / month | Pro gross margin | Agency: LLM cost / month | Agency gross margin |
|---|---|---|---|---|
| Worst case: full quota, every run uses the agent | $66 | **−128%** | $330 | **−233%** |
| Full quota, 60% replayed | $26 | 9% | $132 | −33% |
| **Expected:** 35% of quota used, 60% replayed | $9 | **68%** | $46 | **53%** |

**Finding:** the current quotas lose money for heavy users. Recommended before launching billing: count only agent
runs (not replays) against the quota, or lower the quotas (e.g. Pro 100 agent runs + unlimited replays), and test
`gemini-3.1-flash-lite` as the fast model (~3× cheaper per token).

### Financial projections (illustrative)

A scenario to size the opportunity, not a forecast. Assumes billing launches in month 3, free-to-paid conversion of
~3%, an 80/20 Pro/Agency mix (blended ARPU ≈ $43 / month), paid usage as in the expected case above, and 10% of
free sign-ups active at 10 agent runs / month. Free usage is the largest cost lever; cap it if margins slip.

| | Month 12 | Month 24 | Month 36 |
|---|---|---|---|
| Free sign-ups (cumulative) | 1,500 | 7,000 | 20,000 |
| Paying accounts | 40 | 200 | 600 |
| MRR | $1.7k | $8.6k | $25.8k |
| ARR run-rate | $21k | $103k | $310k |
| Monthly LLM + hosting cost (expected case, incl. free users) | ~$1.1k | ~$5k | ~$14.5k |
| Gross margin | ~38% | ~42% | ~44% |

### Funding plan (proposal)

**$200k pre-seed for 18 months** (≈ $11k / month burn):

| Use | Share | Amount |
|---|---|---|
| Product and engineering (founder + 1 engineer) | 45% | $90k |
| Go-to-market (agency partnerships, content, community) | 30% | $60k |
| Infrastructure and LLM usage | 15% | $30k |
| Legal, payments, operations | 10% | $20k |

Milestones for the round: billing live (M3), benchmark published (M3), 40 paying accounts (M12), 200 (M24).

## User acquisition

Recommendations, all to be validated:

- **Free "check your site" entry point** — free tier plus public share links; every shared report shows the product.
- **Agency partnerships** — white-label reports already exist; reseller pricing to be defined.
- **Communities** — Persian tech communities (Telegram, X, Virgool, Quera).
- **Content** — anonymized "common bugs we found on Iranian sites" posts, only from reports users agreed to share.

Acquisition targets (assumptions): ~3% free-to-paid conversion, < 5% monthly paid churn, CAC under $100 so payback
on Pro stays under 4 months.

## Team

**Mehdi Neysi — founder.** Designed and built the whole product alone: web app, backend, AI agent and infrastructure.
Planned hires: one engineer, then a growth/partnerships lead (see the funding plan).

## Risks

- Testing sites the user does not own (no ownership verification yet).
- LLM price changes (code notes the default fast model's price doubles on 2027-01-01).
- Payment and hosting constraints for Iranian customers using foreign infrastructure — **needs legal/ops review**.
- Agent accuracy on unfamiliar sites — unmeasured until a benchmark exists.

## Roadmap

1. Publish a benchmark of detection rate and cost per run.
2. Interview 10–20 target users (shops, agencies) to validate pricing.
3. Launch billing with per-plan quotas.
4. Add site ownership verification and scheduled runs.
