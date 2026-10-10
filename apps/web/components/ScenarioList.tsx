"use client";

import { useTranslations } from "next-intl";
import type { Scenario } from "@/lib/format";

const dot: Record<Scenario["status"], string> = {
  pending: "bg-fg-3/50",
  running: "bg-accent animate-pulse",
  passed: "bg-success",
  failed: "bg-danger",
  error: "bg-warning",
  skipped: "bg-fg-3/50",
};

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
    "w-full rounded-lg p-2.5 text-start text-fg-2 transition-colors duration-100 hover:bg-card hover:text-fg aria-[current=true]:bg-card aria-[current=true]:text-fg";

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
                <span className="block text-sm text-pretty">{s.title}</span>
                <span className="mt-0.5 block text-xs text-fg-3">
                  {t(`kind.${s.kind}`)} · {t(`scenario.${s.status}`)}
                  {s.replayed && (
                    <span className="ms-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-accent">
                      {t("replayed")}
                    </span>
                  )}
                </span>
                {showReasons && s.verdictReason && (
                  <span className="mt-1.5 block text-sm text-pretty text-fg-3">{s.verdictReason}</span>
                )}
                {showReasons && s.status === "error" && (
                  <span className="mt-1 block text-xs text-warning">{t("agentError")}</span>
                )}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
