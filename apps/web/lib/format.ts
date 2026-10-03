import type { RunDetails } from "@convex/runs";
import { ConvexError } from "convex/values";

export type Step = RunDetails["steps"][number];
export type Scenario = RunDetails["scenarios"][number];
export type Bug = RunDetails["bugs"][number];
export type Run = RunDetails["run"];

const ERROR_CODES = ["INVALID_URL", "INVALID_GOAL", "DAILY_LIMIT"] as const;

/** Translation key under `errors` for a thrown mutation error. */
export function errorKey(e: unknown): string {
  if (e instanceof ConvexError && ERROR_CODES.includes(e.data)) return e.data as string;
  return "generic";
}

/** Translation key under `errors` for a worker-reported run error, or null for raw display. */
export function runErrorKey(error: string): string | null {
  if (error.startsWith("Site unreachable")) return "unreachable";
  if (error.startsWith("This URL is not allowed")) return "notAllowed";
  if (error.startsWith("Worker stopped responding")) return "worker";
  return null;
}

export function formatDuration(ms: number, locale: string): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const nf = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 });
  return `${new Intl.NumberFormat(locale).format(Math.floor(s / 60))}:${nf.format(s % 60)}`;
}

export const formatUsd = (usd: number) => `$${usd < 0.01 && usd > 0 ? usd.toFixed(4) : usd.toFixed(2)}`;

export function runDuration(run: Run, now: number): number {
  const start = run.startedAt ?? run.createdAt;
  return (run.finishedAt ?? now) - start;
}

/** Display value for a step's action: never reveals credentials. */
export function actionValue(step: Step): string | undefined {
  const { value, url, key } = step.action;
  const raw = value ?? key ?? url;
  if (!raw) return undefined;
  const masked = raw.replaceAll("{{password}}", "••••").replaceAll("{{username}}", "••••");
  return masked.length > 28 ? `${masked.slice(0, 27)}…` : masked;
}

export function toMarkdown(data: RunDetails, labels: { duration: string; cost: string }): string {
  const { run, scenarios, bugs } = data;
  const lines = [
    `# QAgent report — ${run.url}`,
    "",
    `**Goal:** ${run.goal}`,
    "",
    `- Scenarios: ${run.summary?.passed ?? 0}/${run.summary?.total ?? scenarios.length} passed`,
    `- Bugs: ${bugs.length}`,
    `- ${labels.duration}: ${formatDuration(runDuration(run, Date.now()), "en")}`,
    `- ${labels.cost}: ${formatUsd(run.cost?.usd ?? 0)}`,
    "",
  ];
  if (run.summaryText) lines.push(run.summaryText, "");
  lines.push("## Bugs", "");
  if (!bugs.length) lines.push("No bugs found.", "");
  for (const b of bugs) {
    lines.push(`### [${b.severity.toUpperCase()}] ${b.title}`, "", "**Steps to reproduce:**", "");
    b.reproSteps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("", `**Expected:** ${b.expected}`, "", `**Actual:** ${b.actual}`, "");
    const evidence = [
      ...b.evidence.networkErrors.map((n) => `${n.method} ${n.url} → ${n.status || "failed"}`),
      ...b.evidence.consoleErrors,
    ];
    if (evidence.length) lines.push("```", ...evidence, "```", "");
    b.screenshotUrls.forEach((u, i) => lines.push(`![screenshot ${i + 1}](${u})`));
    lines.push("");
  }
  lines.push("## Scenarios", "");
  for (const s of scenarios) lines.push(`- **${s.status.toUpperCase()}** ${s.title} — ${s.verdictReason ?? ""}`);
  return lines.join("\n") + "\n";
}
