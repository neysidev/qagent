import type { RunDetails } from "@convex/runs";
import { ConvexError } from "convex/values";

export type Step = RunDetails["steps"][number];
export type Scenario = RunDetails["scenarios"][number];
export type Bug = RunDetails["bugs"][number];
export type Run = RunDetails["run"];

const ERROR_CODES = ["INVALID_URL", "INVALID_GOAL", "DAILY_LIMIT", "INVALID_NAME", "PROJECT_BUSY",
  "INVALID_BRAND", "INVALID_TRACKER", "INVALID_CHANNEL", "INVALID_EMAIL", "EMAIL_NOT_CONFIGURED", "EMAIL_FAILED"] as const;

export function errorKey(e: unknown): string {
  if (e instanceof ConvexError && ERROR_CODES.includes(e.data)) return e.data as string;
  return "generic";
}

const RUN_ERROR_CODES: Record<string, string> = {
  LLM_CREDITS: "llmCredits",
  LLM_AUTH: "llmAuth",
  LLM_MODEL: "llmModel",
  LLM_RATE_LIMIT: "llmRateLimit",
  LLM_UNAVAILABLE: "llmUnavailable",
  LLM_BAD_OUTPUT: "llmBadOutput",
};
const LEGACY_HTTP: Record<string, string> = { "402": "llmCredits", "401": "llmAuth", "403": "llmAuth", "404": "llmModel", "429": "llmRateLimit" };

export function runErrorKey(error: string): string {
  if (error.startsWith("Site unreachable")) return "unreachable";
  if (error.startsWith("This URL is not allowed")) return "notAllowed";
  if (error.startsWith("Worker stopped responding")) return "worker";
  if (error.startsWith("No worker available")) return "noWorker";
  const code = RUN_ERROR_CODES[error.split(":", 1)[0]];
  if (code) return code;
  return LEGACY_HTTP[/Error code: (\d{3})/.exec(error)?.[1] ?? ""] ?? "runFailed";
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  const nf = new Intl.NumberFormat("fa-IR", { minimumIntegerDigits: 2 });
  return `${new Intl.NumberFormat("fa-IR").format(Math.floor(s / 60))}:${nf.format(s % 60)}`;
}

export function runDuration(run: Run, now: number): number {
  const start = run.startedAt ?? run.createdAt;
  return (run.finishedAt ?? now) - start;
}

export function actionValue(step: Step): string | undefined {
  const { value, url, key } = step.action;
  const raw = value ?? key ?? url;
  if (!raw) return undefined;
  const masked = raw.replaceAll("{{password}}", "••••").replaceAll("{{username}}", "••••");
  return masked.length > 28 ? `${masked.slice(0, 27)}…` : masked;
}

const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "auto", style: "short" });
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

const PLANS = ["free", "pro", "agency"] as const;
export const planKey = (plan: string | undefined) =>
  `plans.${PLANS.includes(plan as (typeof PLANS)[number]) ? plan : "free"}` as `plans.${(typeof PLANS)[number]}`;
