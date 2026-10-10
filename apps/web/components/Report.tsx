"use client";

import type { RunDetails } from "@convex/runs";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import type { Bug } from "@/lib/format";
import { CleanRunIllustration, NoScenariosIllustration } from "./illustrations";
import { ScenarioList } from "./ScenarioList";
import { StepViewer } from "./StepViewer";
import { ZoomImage } from "./ZoomImage";
import { card, cardHeader, cardTitle, pill, type Tone } from "./ui";

const severityTone: Record<Bug["severity"], Tone> = { critical: "danger", high: "danger", medium: "warning", low: "neutral" };

export function Report({ data, bugActions }: { data: RunDetails; bugActions?: (bug: Bug) => ReactNode }) {
  const t = useTranslations("report");
  const { run, scenarios, steps, bugs } = data;
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {run.summaryText && (
        <section className={card}>
          <header className={cardHeader}>
            <h2 className={cardTitle}>
              <Sparkles className="size-4 text-accent" strokeWidth={1.75} /> {t("title")}
            </h2>
            {run.replayOf && scenarios.length > 0 && (run.cost?.llmCalls ?? 0) === 0 && (
              <span className={pill("accent")}>{t("replayedBadge")}</span>
            )}
          </header>
          <p className="p-4 text-sm leading-7 text-pretty text-fg-2">{run.summaryText}</p>
        </section>
      )}

      {scenarios.length === 0 ? (
        <section className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
          <NoScenariosIllustration className="w-56" />
          <h3 className="mt-5 text-lg font-bold">{t("noScenariosTitle")}</h3>
          <p className="mt-2 max-w-md text-sm leading-[1.9] text-pretty text-fg-2">
            {run.status === "canceled" ? t("noScenariosCanceled") : t("noScenariosFailed")}
          </p>
        </section>
      ) : (
        <>
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 pt-2 text-sm font-medium text-fg-2">
              {t("bugs")} <span className="font-mono text-fg-3">{bugs.length}</span>
            </h3>
            {bugs.length === 0 ? (
              <div className={`${card} flex flex-col items-center px-6 py-10 text-center`}>
                <CleanRunIllustration className="w-44" />
                <p className="mt-4 font-bold">{t("noBugs")}</p>
                <p className="mt-1.5 text-sm text-fg-2">{t("noBugsBody")}</p>
              </div>
            ) : (
              bugs.map((b) => <BugCard key={b._id} bug={b} actions={bugActions?.(b)} />)
            )}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className={`${card} h-fit`}>
              <header className={cardHeader}>
                <h3 className={cardTitle}>{t("verdicts")}</h3>
              </header>
              <div className="p-1.5">
                <ScenarioList scenarios={scenarios} selected={scenarioId} onSelect={setScenarioId} showReasons />
              </div>
            </div>
            <div className={`${card} min-w-0 p-4`}>
              <h3 className={`${cardTitle} mb-3`}>{t("timeline")}</h3>
              <StepViewer
                key={scenarioId ?? "all"}
                steps={scenarioId ? steps.filter((s) => s.scenarioId === scenarioId) : steps}
                scenarios={scenarios}
                live={false}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function BugCard({ bug, actions }: { bug: Bug; actions?: ReactNode }) {
  const t = useTranslations("report");
  const { consoleErrors, networkErrors } = bug.evidence;
  return (
    <article className={`${card} animate-rise space-y-4 p-5`}>
      <header className="flex items-start gap-3">
        <span className={pill(severityTone[bug.severity])}>
          {t(`severity.${bug.severity}`)}
        </span>
        <h4 className="min-w-0 flex-1 font-medium text-pretty">{bug.title}</h4>
        {actions}
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-success/15 bg-success-soft/50 p-3">
          <p className="text-xs font-medium text-success">{t("expected")}</p>
          <p className="mt-1 text-sm text-pretty text-fg-2">{bug.expected}</p>
        </div>
        <div className="rounded-lg border border-danger/15 bg-danger-soft/50 p-3">
          <p className="text-xs font-medium text-danger">{t("actual")}</p>
          <p className="mt-1 text-sm text-pretty text-fg-2">{bug.actual}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-fg-3">{t("repro")}</p>
        <ol className="mt-1.5 list-decimal space-y-1 ps-5 text-sm text-fg-2 marker:font-mono marker:text-fg-3">
          {bug.reproSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>
      {bug.screenshotUrls.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-fg-3">{t("screenshots")}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {bug.screenshotUrls.map((u, i) => (
              <ZoomImage key={u} src={u} alt={`${bug.title} ${i + 1}`} className="h-28 shrink-0 rounded-lg border border-line transition-[border-color] hover:border-line-strong" />
            ))}
          </div>
        </div>
      )}
      {networkErrors.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-fg-3 hover:text-fg">{t("network", { n: networkErrors.length })}</summary>
          <pre dir="ltr" className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface p-3 font-mono text-xs text-fg-2">
            {networkErrors.map((n) => `${n.method} ${n.url} → ${n.status || "failed"}`).join("\n")}
          </pre>
        </details>
      )}
      {consoleErrors.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-fg-3 hover:text-fg">{t("console", { n: consoleErrors.length })}</summary>
          <pre dir="ltr" className="mt-2 overflow-x-auto rounded-xl border border-line bg-surface p-3 font-mono text-xs text-fg-2">
            {consoleErrors.join("\n")}
          </pre>
        </details>
      )}
    </article>
  );
}
