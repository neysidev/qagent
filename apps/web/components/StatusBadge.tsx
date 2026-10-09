"use client";

import type { Doc } from "@convex/_generated/dataModel";
import { Bug, CircleCheck, CircleDashed, CircleSlash, CircleX } from "lucide-react";
import { useTranslations } from "next-intl";
import { pill, type Tone } from "./ui";

type Status = Doc<"runs">["status"];

const tone: Record<Status, Tone> = {
  queued: "neutral",
  planning: "accent",
  running: "accent",
  verifying: "accent",
  reporting: "accent",
  done: "success",
  failed: "danger",
  canceled: "neutral",
};

export const isActive = (status: Status) =>
  status === "queued" || status === "planning" || status === "running" || status === "verifying" || status === "reporting";

export function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations("status");
  return (
    <span className={pill(tone[status])}>
      <span className={`size-1.5 rounded-full bg-current ${isActive(status) && status !== "queued" ? "animate-pulse" : ""}`} aria-hidden />
      {t(status)}
    </span>
  );
}

/** Compact glyph for task lists: what a finished job produced, or that it's still working. */
export function TaskIcon({ status, bugs = 0 }: { status: Status; bugs?: number }) {
  const cls = "size-4 shrink-0";
  if (status === "queued") return <CircleDashed className={`${cls} text-fg-3`} aria-hidden />;
  if (isActive(status))
    return (
      <span className="grid size-4 shrink-0 place-items-center" aria-hidden>
        <span className="size-3 animate-spin rounded-full border-[1.5px] border-accent/25 border-t-accent motion-reduce:animate-none" />
      </span>
    );
  if (status === "failed") return <CircleX className={`${cls} text-danger`} aria-hidden />;
  if (status === "canceled") return <CircleSlash className={`${cls} text-fg-3`} aria-hidden />;
  return bugs > 0 ? <Bug className={`${cls} text-warning`} aria-hidden /> : <CircleCheck className={`${cls} text-success`} aria-hidden />;
}
