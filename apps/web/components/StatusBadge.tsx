"use client";

import type { Doc } from "@convex/_generated/dataModel";
import { useTranslations } from "next-intl";

const colors: Record<Doc<"runs">["status"], string> = {
  queued: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  planning: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  running: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  verifying: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  reporting: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  done: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  canceled: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export function StatusBadge({ status }: { status: Doc<"runs">["status"] }) {
  const t = useTranslations("status");
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}>{t(status)}</span>;
}
