"use client";

import type { Doc } from "@convex/_generated/dataModel";
import { useTranslations } from "next-intl";

const ACTIVE = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
const colors: Record<Doc<"runs">["status"], string> = {
  queued: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  planning: ACTIVE,
  running: ACTIVE,
  verifying: ACTIVE,
  reporting: ACTIVE,
  done: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  canceled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export const isActive = (status: Doc<"runs">["status"]) =>
  status === "queued" || status === "planning" || status === "running" || status === "verifying" || status === "reporting";

export function StatusBadge({ status }: { status: Doc<"runs">["status"] }) {
  const t = useTranslations("status");
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {isActive(status) && <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden />}
      {t(status)}
    </span>
  );
}
