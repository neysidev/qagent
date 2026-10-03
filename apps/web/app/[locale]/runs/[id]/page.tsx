"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { RunDetails } from "@convex/runs";
import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Report } from "@/components/Report";
import { PageSkeleton, RequireAuth } from "@/components/RequireAuth";
import { ScenarioList } from "@/components/ScenarioList";
import { isActive, StatusBadge } from "@/components/StatusBadge";
import { StepViewer } from "@/components/StepViewer";
import { button, card } from "@/components/ui";
import { Link, useRouter } from "@/i18n/routing";
import { errorKey, formatDuration, formatUsd, runDuration, runErrorKey, toMarkdown } from "@/lib/format";

function useNow(ticking: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);
  return now;
}

function RunHeader({ data }: { data: RunDetails }) {
  const t = useTranslations("run");
  const locale = useLocale();
  const { run } = data;
  const active = isActive(run.status);
  const now = useNow(active);
  const cancel = useMutation(api.runs.cancel);

  return (
    <div className="space-y-3">
      <Link href="/dashboard" className="no-print text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        {locale === "fa" ? "→" : "←"} {t("back")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={run.status} />
            <a href={run.url} target="_blank" rel="noreferrer" dir="ltr" className="truncate text-sm text-zinc-500 hover:underline">
              {run.url}
            </a>
          </div>
          <h1 className="text-xl font-semibold text-balance sm:text-2xl">{run.goal}</h1>
        </div>
        <div className="flex items-center gap-4">
          <dl className="flex gap-4 text-sm">
            <div>
              <dt className="text-xs text-zinc-500">{t("elapsed")}</dt>
              <dd className="font-medium tabular-nums">{formatDuration(runDuration(run, now), locale)}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">{t("cost")}</dt>
              <dd className="font-medium tabular-nums" dir="ltr">{formatUsd(run.cost?.usd ?? 0)}</dd>
            </div>
          </dl>
          {active && (
            <button onClick={() => void cancel({ runId: run._id })} className={`${button.danger} no-print`}>
              {t("cancel")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveView({ data }: { data: RunDetails }) {
  const t = useTranslations("run");
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const { run, scenarios, steps } = data;

  if (scenarios.length === 0) {
    return (
      <div className={`${card} flex flex-col items-center gap-4 px-6 py-16 text-center`}>
        <span className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600" aria-hidden />
        <p className="text-zinc-600 dark:text-zinc-400">{run.status === "queued" ? t("waiting") : t("planning")}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className={`${card} h-fit p-2`}>
        <h2 className="px-3 pt-2 pb-1 text-sm font-semibold">{t("scenarios")}</h2>
        <ScenarioList scenarios={scenarios} selected={scenarioId} onSelect={setScenarioId} />
      </aside>
      <div className="min-w-0">
        <StepViewer
          key={scenarioId ?? "all"}
          steps={scenarioId ? steps.filter((s) => s.scenarioId === scenarioId) : steps}
          scenarios={scenarios}
          live
        />
      </div>
    </div>
  );
}

function ReportActions({ data }: { data: RunDetails }) {
  const t = useTranslations("report");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const rerun = useMutation(api.runs.rerun);
  const share = useMutation(api.runs.share);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRerun() {
    try {
      const runId = await rerun({ runId: data.run._id });
      router.push(`/runs/${runId}`);
    } catch (e) {
      setError(te(errorKey(e)));
    }
  }
  async function onShare() {
    const token = await share({ runId: data.run._id });
    await navigator.clipboard.writeText(`${location.origin}/${locale}/share/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  function onMarkdown() {
    const md = toMarkdown(data, { duration: t("duration"), cost: t("cost") });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = `qagent-report-${data.run._id}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      {error && <p role="alert" className="w-full text-sm text-red-600">{error}</p>}
      <button onClick={() => void onRerun()} className={button.primary}>{t("rerun")}</button>
      <button onClick={() => void onShare()} className={button.secondary} aria-live="polite">
        {copied ? t("copied") : t("share")}
      </button>
      <button onClick={onMarkdown} className={button.secondary}>{t("markdown")}</button>
      <button onClick={() => window.print()} className={button.secondary}>{t("print")}</button>
    </>
  );
}

function RunError({ error }: { error: string }) {
  const te = useTranslations("errors");
  const key = runErrorKey(error);
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
      {key ? te(key) : <>{te("generic")} <span dir="ltr" className="opacity-70">({error})</span></>}
    </div>
  );
}

function Run({ runId }: { runId: Id<"runs"> }) {
  const t = useTranslations("report");
  const data = useQuery(api.runs.get, { runId });
  if (!data) return <PageSkeleton />;
  const { run } = data;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <RunHeader data={data} />
      {run.error && <RunError error={run.error} />}
      {run.status === "canceled" && <p className="text-sm text-zinc-500">{t("canceled")}</p>}
      {isActive(run.status) ? <LiveView data={data} /> : <Report data={data} actions={<ReportActions data={data} />} />}
    </main>
  );
}

export default function RunPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <>
      <Header />
      <RequireAuth>
        <Run runId={id as Id<"runs">} />
      </RequireAuth>
    </>
  );
}
