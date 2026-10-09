/**
 * Landing "Numbers" section. Only real values: fill from `python -m tests.benchmark` (apps/worker) and
 * docs/technical.md. `null` metrics are not rendered.
 */
export const benchmark = {
  detectionRate: null as number | null, // percent of seeded demo-shop bugs found
  avgRunSeconds: null as number | null,
  avgCostUsd: null as number | null,
  templates: 4, // apps/web/components/Composer.tsx TEMPLATES
  parallelScenarios: 3, // worker SCENARIO_PARALLELISM default
};
