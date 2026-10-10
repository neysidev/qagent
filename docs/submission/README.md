# QAgent — Submission package

QAgent (کیوایجنت) is an AI agent that tests a website's user flows like a real user and returns an evidence-backed bug
report. You give it a URL and a goal in plain Persian; it plans scenarios, drives a real Chromium browser, and reports
what broke, where, and why.

| # | Deliverable | File |
|---|---|---|
| 1 | Product access and user journey | [product-access.md](product-access.md) |
| 2 | Technical and infrastructure documentation | [technical.md](technical.md) |
| 3 | Business plan | [business-plan.md](business-plan.md) |
| 4 | Investor pitch | [investor-pitch.md](investor-pitch.md) |
| 5 | Pitch deck (PDF) | [pitch-deck.pdf](pitch-deck.pdf) |

Setup and deploy commands live in the repository [README](../../README.md) and are not duplicated here.

## Status legend

- **Verified** — confirmed in the codebase or by a direct check on 2026-10-10.
- **Unverified** — plausible but not checked end to end; needs a manual check.
- **Estimate / Target / Illustrative** — a number worked out from stated assumptions, not measured.
- **Assumption** — a business hypothesis that needs validation.

## Open items before submitting

| Item | Where |
|---|---|
| Run the full journey on production (sign up → run → report) and confirm the worker is online | [product-access](product-access.md#verification-checklist) |
| Replace the estimated cost per run ($0.22) with the measured average from real runs | [technical](technical.md#costs) |
| Run the benchmark against the published targets | [technical](technical.md#benchmark) |
| Validate pricing and quotas before launching billing (current quotas lose money for heavy users) | [business-plan](business-plan.md#unit-economics) |

Market figures cite their sources. Cost, margin, projection and funding numbers are estimates and proposals,
labelled as such in each document.
