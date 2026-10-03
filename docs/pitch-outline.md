# QAgent — Pitch outline

1. **Problem** — Small teams ship without QA; customers find the bugs in signup, login, cart and checkout.
2. **Market** — Iranian startups, agencies and online shops with no QA role; agencies multiply reach.
3. **Solution + live demo** — URL + goal in Persian → watch the agent click through the demo shop → report with a
   500 error on "remove from cart", screenshots and repro steps.
4. **How the agent works** — LangGraph: plan → parallel scenarios in real Chromium (observe → decide → act) →
   verifier that separates "site broken" from "agent stuck" → report. Evidence: console + network.
5. **Traction / benchmark** — detection rate, false positives, average time and cost from
   `tests/benchmark.py` (insert measured numbers from `technical.md`).
6. **Business model** — Free / Pro / Agency by run volume; replay keeps re-run cost at $0.
7. **Competition** — Mabl, Testim, QA Wolf, Momentic, Octomind, scripts, manual QA → QAgent is no-code, Persian,
   RTL, local payment, self-healing.
8. **Team** — names, roles, relevant experience.
9. **Roadmap** — scheduled monitoring, CI/GitHub integration, Telegram/Slack alerts, site ownership verification.
