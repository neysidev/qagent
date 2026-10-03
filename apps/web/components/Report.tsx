"use client";

import type { RunDetails } from "@convex/runs";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { formatDuration, formatUsd, runDuration, type Bug } from "@/lib/format";
import { ScenarioList } from "./ScenarioList";
import { StepViewer } from "./StepViewer";
import { card } from "./ui";

const severityColor: Record<Bug["severity"], string> = {
  critical: "bg-red-600 text-white",
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function Report({ data, actions }: { data: RunDetails; actions?: ReactNode }) {
  const t = useTranslations("report");
  const locale = useLocale();
  const { run, scenarios, steps, bugs } = data;
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const passed = scenarios.filter((s) => s.status === "passed").length;

  const stats = [
    { label: t("scenarios"), value: new Intl.NumberFormat(locale).format(scenarios.length) },
    { label: t("passed"), value: new Intl.NumberFormat(locale).format(passed), tone: "text-green-600 dark:text-green-400" },
    { label: t("bugs"), value: new Intl.NumberFormat(locale).format(bugs.length), tone: bugs.length ? "text-red-600 dark:text-red-400" : "" },
    { label: t("duration"), value: formatDuration(runDuration(run, Date.now()), locale) },
    { label: t("cost"), value: formatUsd(run.cost?.usd ?? 0), ltr: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={`${card} p-4`}>
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.tone ?? ""}`} dir={s.ltr ? "ltr" : undefined}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {run.summaryText && <p className={`${card} p-5 leading-relaxed text-pretty`}>{run.summaryText}</p>}

      <section className="space-y-3">
        <h3 className="font-semibold">{t("bugs")}</h3>
        {bugs.length === 0 ? (
          <div className={`${card} p-6 text-center`}>
            <p className="font-medium text-green-700 dark:text-green-400">{t("noBugs")}</p>
            <p className="mt-1 text-sm text-zinc-500">{t("noBugsBody")}</p>
          </div>
        ) : (
          bugs.map((b) => <BugCard key={b._id} bug={b} />)
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div>
          <h3 className="mb-2 font-semibold">{t("verdicts")}</h3>
          <ScenarioList scenarios={scenarios} selected={scenarioId} onSelect={setScenarioId} showReasons />
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 font-semibold">{t("timeline")}</h3>
          <StepViewer
            key={scenarioId ?? "all"}
            steps={scenarioId ? steps.filter((s) => s.scenarioId === scenarioId) : steps}
            scenarios={scenarios}
            live={false}
          />
        </div>
      </section>
    </div>
  );
}

function BugCard({ bug }: { bug: Bug }) {
  const t = useTranslations("report");
  const { consoleErrors, networkErrors } = bug.evidence;
  return (
    <article className={`${card} animate-rise space-y-4 p-5`}>
      <header className="flex items-start gap-3">
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${severityColor[bug.severity]}`}>
          {t(`severity.${bug.severity}`)}
        </span>
        <h4 className="font-semibold text-pretty">{bug.title}</h4>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/40">
          <p className="text-xs font-semibold text-green-800 dark:text-green-300">{t("expected")}</p>
          <p className="mt-1 text-sm text-pretty">{bug.expected}</p>
        </div>
        <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/40">
          <p className="text-xs font-semibold text-red-800 dark:text-red-300">{t("actual")}</p>
          <p className="mt-1 text-sm text-pretty">{bug.actual}</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">{t("repro")}</p>
        <ol className="mt-1 list-decimal space-y-1 ps-5 text-sm">
          {bug.reproSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
      {bug.screenshotUrls.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">{t("screenshots")}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {bug.screenshotUrls.map((u, i) => (
              <a key={u} href={u} target="_blank" rel="noreferrer" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`${bug.title} ${i + 1}`} className="h-28 rounded-lg border border-zinc-200 dark:border-zinc-800" />
              </a>
            ))}
          </div>
        </div>
      )}
      {networkErrors.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">{t("network", { n: networkErrors.length })}</summary>
          <pre dir="ltr" className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-950">
            {networkErrors.map((n) => `${n.method} ${n.url} → ${n.status || "failed"}`).join("\n")}
          </pre>
        </details>
      )}
      {consoleErrors.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-semibold">{t("console", { n: consoleErrors.length })}</summary>
          <pre dir="ltr" className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs dark:bg-zinc-950">
            {consoleErrors.join("\n")}
          </pre>
        </details>
      )}
    </article>
  );
}
