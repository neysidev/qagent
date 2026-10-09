import type { ReactNode } from "react";

/** One layout for every empty state: illustration, a short title, an optional line of context, an optional action. */
export function EmptyState({ art, title, body, action, compact = false, className = "" }: {
  art: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "px-4 py-6" : "px-6 py-12"} ${className}`}>
      {art}
      <p className={`font-bold ${compact ? "mt-3 text-sm" : "mt-5"}`}>{title}</p>
      {body && <p className={`max-w-sm text-pretty text-fg-2 ${compact ? "mt-1 text-xs leading-[1.8]" : "mt-2 text-sm leading-[1.9]"}`}>{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
