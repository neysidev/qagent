"use client";

import { useTranslations } from "next-intl";
import type { Scenario } from "@/lib/format";

const dot: Record<Scenario["status"], string> = {
  pending: "bg-zinc-300 dark:bg-zinc-600",
  running: "bg-blue-500 animate-pulse",
  passed: "bg-green-500",
  failed: "bg-red-500",
  error: "bg-amber-500",
  skipped: "bg-zinc-300 dark:bg-zinc-600",
};

/** Scenarios with live status; clicking one filters the step viewer. */
export function ScenarioList({
  scenarios,
  selected,
  onSelect,
  showReasons = false,
}: {
  scenarios: Scenario[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  showReasons?: boolean;
}) {
  const t = useTranslations("run");
  const row =
    "w-full rounded-lg p-3 text-start transition-colors hover:bg-zinc-100 aria-[current=true]:bg-zinc-100 dark:hover:bg-zinc-800 dark:aria-[current=true]:bg-zinc-800";

  return (
    <ul className="space-y-1">
      <li>
        <button onClick={() => onSelect(null)} aria-current={selected === null} className={`${row} text-sm font-medium`}>
          {t("allScenarios")}
        </button>
      </li>
      {scenarios.map((s) => (
        <li key={s._id} className="animate-rise">
          <button onClick={() => onSelect(s._id)} aria-current={selected === s._id} className={row}>
            <span className="flex items-start gap-2.5">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${dot[s.status]}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-pretty">{s.title}</span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  {t(`kind.${s.kind}`)} · {t(`scenario.${s.status}`)}
                </span>
                {showReasons && s.verdictReason && (
                  <span className="mt-1.5 block text-sm text-pretty text-zinc-600 dark:text-zinc-400">{s.verdictReason}</span>
                )}
                {showReasons && s.status === "error" && (
                  <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">{t("agentError")}</span>
                )}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
