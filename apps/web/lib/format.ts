import type { RunDetails } from "@convex/runs";
import { ConvexError } from "convex/values";

export type Step = RunDetails["steps"][number];
export type Scenario = RunDetails["scenarios"][number];
export type Bug = RunDetails["bugs"][number];
export type Run = RunDetails["run"];

const ERROR_CODES = ["INVALID_URL", "INVALID_GOAL", "DAILY_LIMIT", "INVALID_NAME", "PROJECT_BUSY"] as const;

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

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const nf = new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 });
  return `${new Intl.NumberFormat("fa-IR").format(Math.floor(s / 60))}:${nf.format(s % 60)}`;
}

/** Toman per US dollar. Model usage is billed in dollars; the rate moves often, so it is configured, not hardcoded. */
const USD_TOMAN = Number(process.env.NEXT_PUBLIC_USD_TOMAN_RATE) || 0;
const tomanFormat = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

/** Model cost for display, in toman. Shows "—" until a rate is configured rather than a made-up number. */
export function formatCost(usd: number): string {
  if (!USD_TOMAN) return "—";
  const toman = usd * USD_TOMAN;
  if (toman > 0 && toman < 1) return "کمتر از ۱ تومان";
  return `${tomanFormat.format(toman)} تومان`;
}

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
    `# گزارش کیوایجنت — ${run.url}`,
    "",
    `**هدف:** ${run.goal}`,
    "",
    `- سناریوها: ${run.summary?.passed ?? 0}/${run.summary?.total ?? scenarios.length} موفق`,
    `- باگ‌ها: ${bugs.length}`,
    `- ${labels.duration}: ${formatDuration(runDuration(run, Date.now()))}`,
    `- ${labels.cost}: ${formatCost(run.cost?.usd ?? 0)}`,
    "",
  ];
  if (run.summaryText) lines.push(run.summaryText, "");
  lines.push("## باگ‌ها", "");
  if (!bugs.length) lines.push("باگی پیدا نشد.", "");
  for (const b of bugs) {
    lines.push(`### [${b.severity.toUpperCase()}] ${b.title}`, "", "**مراحل بازتولید:**", "");
    b.reproSteps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push("", `**انتظار:** ${b.expected}`, "", `**نتیجه:** ${b.actual}`, "");
    const evidence = [
      ...b.evidence.networkErrors.map((n) => `${n.method} ${n.url} → ${n.status || "failed"}`),
      ...b.evidence.consoleErrors,
    ];
    if (evidence.length) lines.push("```", ...evidence, "```", "");
    b.screenshotUrls.forEach((u, i) => lines.push(`![اسکرین‌شات ${i + 1}](${u})`));
    lines.push("");
  }
  lines.push("## سناریوها", "");
  for (const s of scenarios) lines.push(`- **${s.status.toUpperCase()}** ${s.title} — ${s.verdictReason ?? ""}`);
  return lines.join("\n") + "\n";
}

const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "auto", style: "short" });
/** "۵ دقیقه پیش" style relative time. */
export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.round((ts - now) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(0, "minute");
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86400), "day");
}

export const nf = new Intl.NumberFormat("fa-IR");
export const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};
