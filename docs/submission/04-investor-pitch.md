# 4. Investor pitch

A 12-slide deck outline. Figures come from [03-business-plan.md](03-business-plan.md) and
[02-technical.md](02-technical.md). Sourced figures cite their source; everything labelled *estimate*, *target* or
*illustrative* is a projection, not a measured result, and should be presented as such.

---

### Slide 1 — Title

**QAgent (کیوایجنت): an AI tester that uses your website like a real customer.**
Product URL: https://qagent-web.vercel.app · Mehdi Neysi, founder

### Slide 2 — Problem

Small teams ship every week without QA. Customers find the broken sign-up, login, cart and checkout first.
- Scripted tests need engineers to write and maintain them.
- Manual QA is slow and leaves no evidence.
- Next step: 10–20 customer interviews to back this slide with quotes.

### Slide 3 — Market opportunity

- Beachhead: Iranian startups, online shops and web agencies with no QA role; Persian-speaking teams generally.
- Agencies multiply reach: one account, many client sites.
- **TAM:** global AI test automation, $8.8B (2025) → $36B (2032), 22.3% CAGR (MarketsandMarkets).
- **Iranian base:** ~50,000 live sites with the eNamad trust seal (BuiltWith); ~39,000 new seals in H1 2023.
- **SAM (estimate):** ~10,000 businesses that ship regularly ≈ $5.2M / year.
- **SOM (36-month target):** 600 paying accounts ≈ $310k ARR.

### Slide 4 — Solution

Type a URL and a goal in plain Persian. QAgent:
1. Plans 2–5 test scenarios (happy path and negative/edge cases).
2. Runs them in a real Chromium browser, step by step, watchable live.
3. Separates real site bugs from its own failures.
4. Delivers a report with severity, repro steps, screenshots, console and network errors.

### Slide 5 — Product demo

Live walkthrough of the deployed product:
sign up → URL + goal → live run → bug report → share link → $0 re-run.

### Slide 6 — How it works

- Planner → parallel scenario executors (observe → decide → act) → verifier → reporter, built on LangGraph.
- Fast model for most steps; smart model only re-checks failures and low-confidence verdicts.
- Every model call is costed and shown on the run.
- Safety: only public sites, private-network requests blocked, test passwords never sent to the model.

### Slide 7 — Competitive advantage

| | QAgent | Enterprise AI testing (Mabl, Testim) | Managed QA (QA Wolf) | Scripts (Cypress, Playwright) |
|---|---|---|---|---|
| No code | ✓ | Partial | ✓ (service) | ✗ |
| Persian / RTL | ✓ | ✗ | ✗ | n/a |
| Self-healing $0 re-runs | ✓ | Varies | n/a | ✗ |
| Small-team pricing | ✓ | ✗ | ✗ | Free but engineer time |

Competitor cells reflect public positioning; verify before presenting.
Moat today: localization, replay cost structure, evidence-first reports. Long-term: a growing library of replay
traces per site makes monitoring cheaper over time, and agency white-label creates distribution lock-in.

### Slide 8 — Business model

Subscription by run volume (pricing on the live landing page):
Free (10 runs/day) · Pro 990k toman/month (300 runs) · Agency 3.5M toman/month (1,500 runs, white-label).
Billing is not live yet.
- Estimated LLM cost: ~$0.22 per agent run, $0 per replayed run; fixed hosting $20–85 / month.
- Expected gross margin: 68% Pro, 53% Agency (35% of quota used, 60% replayed).
- Known risk: full-quota agent usage would be negative-margin; the plan is to count only agent runs against quotas.

### Slide 9 — Traction

- Product: deployed web app with sign-up, live runs, reports, sharing, export, integrations.
- Stage: pre-revenue, billing not live; no paying customers yet.
- Benchmark targets (to publish by month 3): ≥ 80% detection on seeded bugs, ≤ 10% false positives, ≤ 4 min and
  ≤ $0.25 per run.

### Slide 10 — Team

| Name | Role | Relevant experience |
|---|---|---|
| Mehdi Neysi | Founder | Designed and built the whole product alone: web app, backend, AI agent, infrastructure |

Planned hires with this round: one engineer, then a growth / partnerships lead.

### Slide 11 — Growth strategy and roadmap

Acquisition: free tier with shareable reports, agency partnerships, Persian tech communities, content from anonymized findings.

Roadmap (not built yet): billing → scheduled monitoring with alerts → CI / GitHub checks → site ownership
verification → team accounts.

Milestones: billing live and benchmark published (M3) · 40 paying accounts (M12) · 200 (M24) · 600 (M36).

### Slide 12 — The ask

**$200k pre-seed, 18 months of runway** (≈ $11k / month).
Use of funds: 45% product and engineering · 30% go-to-market · 15% infrastructure and LLM · 10% legal and ops.

Illustrative trajectory: $21k ARR (M12) → $103k (M24) → $310k (M36), gross margin rising from ~38% to ~44%.
