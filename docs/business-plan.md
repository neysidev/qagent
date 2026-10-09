# QAgent — Business plan

## Problem

Small teams — startups, web agencies, small online shops — ship changes without QA. Bugs in signup, login, cart and
checkout are found by customers, which costs sales and trust. Scripted test tools (Selenium, Cypress, Playwright)
need engineers to write and maintain tests; manual QA is slow and expensive.

## Value proposition

"Tell QAgent what to check. It uses your site like a real user and tells you exactly what broke, where, and why."

- **No code:** goals in plain Persian, or one-click templates.
- **Evidence, not guesses:** severity, reproduction steps, screenshots, console and network errors.
- **Watchable:** the run is visible live, step by step.
- **Cheap re-runs:** passed flows replay deterministically at $0 LLM cost and self-heal when the UI changes.
- **Local fit:** RTL-correct Persian UI and reports, Iranian phone formats in test data, local pricing.

## Market

Primary: Iranian startups, agencies and online shops (WooCommerce, custom shops) that have no QA role. Secondary:
any small team that works in Persian. Agencies are a multiplier: each manages many client sites.

## Competitors and differentiation

| Alternative | Gap QAgent fills |
|---|---|
| Mabl, Testim | Enterprise pricing and onboarding; no Persian/RTL |
| QA Wolf | Managed service, high price, built for larger teams |
| Momentic, Octomind | AI testing, English-first, no local payment |
| Selenium / Cypress / Playwright scripts | Need engineers to write and maintain tests |
| Manual QA / freelancers | Slow, inconsistent, no evidence trail |

Differentiation: natural language including Persian, no code, RTL-aware reports, local payment, self-healing replay,
and a free "check your site" entry point.

## Revenue model

Subscriptions by run volume (shown on the landing page):

| Plan | Price | Includes |
|---|---|---|
| Free | $0 | 10 runs/day, live viewer, shareable reports |
| Pro | $29/mo (990k toman) | 300 runs/month, test accounts, replay re-runs |
| Agency | $99/mo (3.5M toman) | 1,500 runs/month, unlimited projects, white-label reports |

Next revenue lever: scheduled nightly checks with alerts (roadmap).

## Costs

- **LLM:** per-run cost is measured and stored on every run (see the benchmark in `technical.md`). Replay re-runs
  cost $0 in LLM fees, which keeps margins high for the recurring-check use case.
- **Compute:** one Railway worker runs `MAX_CONCURRENT_RUNS` runs in parallel with a single warm Chromium.
- **Platform:** Vercel and Convex free/low tiers at MVP scale.

## Acquisition

- Free "check your site" tool with a shareable public report — every report is a referral.
- Agency partnerships (reseller pricing, white-label).
- Developer and founder communities (Persian tech Telegram/Twitter, Quera, Virgool).
- Content: "top 5 bugs we found on Iranian shops" style posts built from anonymized reports.
