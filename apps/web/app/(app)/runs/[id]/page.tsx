"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { RunDetails } from "@convex/runs";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Check, Clock, Coins, Download, Ellipsis, ExternalLink, Link2, Printer, RotateCcw, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog, menuItem, Popover } from "@/components/overlay";
import { Report } from "@/components/Report";
import { PageSkeleton } from "@/components/RequireAuth";
import { ScenarioList } from "@/components/ScenarioList";
import { isActive, StatusBadge } from "@/components/StatusBadge";
import { StepViewer } from "@/components/StepViewer";
import { button, card, cardHeader, cardTitle } from "@/components/ui";
import { errorKey, formatDuration, formatUsd, hostOf, runDuration, runErrorKey, toMarkdown } from "@/lib/format";

function useNow(ticking: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);
  return now;
}

const STAGES = ["queued", "planning", "running", "verifying", "reporting"] as const;

function RunHeader({ data, actions }: { data: RunDetails; actions: React.ReactNode }) {
  const t = useTranslations("run");
  const { run } = data;
  const active = isActive(run.status);
  const now = useNow(active);

  return (
    <div className="space-y-4">
      <Link href={`/projects/${run.projectId}`} className="no-print inline-flex items-center gap-1.5 rounded text-sm text-fg-3 transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent">
        <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
        <span dir="ltr">{hostOf(run.url)}</span>
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={run.status} />
            <a
              href={run.url}
              target="_blank"
              rel="noreferrer"
              dir="ltr"
              className="inline-flex min-w-0 items-center gap-1 truncate text-sm text-fg-3 transition-colors hover:text-fg"
            >
              <ExternalLink className="size-3.5 shrink-0" />
              <span className="truncate">{run.url}</span>
            </a>
          </div>
          <h1 className="text-xl leading-[1.35] font-bold text-balance sm:text-[26px]">{run.goal}</h1>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-fg-3">
          <Clock className="size-3.5" /> {t("elapsed")}
          <span className="font-mono text-fg">{formatDuration(runDuration(run, now))}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-fg-3">
          <Coins className="size-3.5" /> {t("cost")}
          <span dir="ltr" className="font-mono text-fg">{formatUsd(run.cost?.usd ?? 0)}</span>
        </span>
      </div>
    </div>
  );
}

/** Agent job pipeline: where the run is right now. */
function StageTrack({ status }: { status: RunDetails["run"]["status"] }) {
  const t = useTranslations("status");
  const current = STAGES.indexOf(status as (typeof STAGES)[number]);
  return (
    <ol className={`${card} flex overflow-x-auto p-1.5`}>
      {STAGES.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li
            key={s}
            aria-current={now ? "step" : undefined}
            className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-xs whitespace-nowrap ${now ? "bg-accent-soft text-accent" : done ? "text-fg-2" : "text-fg-3"}`}
          >
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10px] ${done ? "bg-success-soft text-success" : now ? "bg-accent text-on-accent" : "bg-card ring-1 ring-line"}`}
            >
              {done ? <Check className="size-3" strokeWidth={2.5} /> : i + 1}
            </span>
            {t(s)}
            {i < STAGES.length - 1 && <span className={`h-px min-w-4 flex-1 ${done ? "bg-success/40" : "bg-line-strong"}`} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function LiveView({ data }: { data: RunDetails }) {
  const t = useTranslations("run");
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const { run, scenarios, steps } = data;

  if (scenarios.length === 0) {
    return (
      <div className={`${card} flex flex-col items-center gap-4 px-6 py-20 text-center`}>
        <span className="size-8 animate-spin rounded-full border-2 border-accent/20 border-t-accent motion-reduce:animate-none" aria-hidden />
        <p className="text-sm text-fg-2">{run.status === "queued" ? t("waiting") : t("planning")}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className={`${card} h-fit`}>
        <header className={cardHeader}>
          <h2 className={cardTitle}>{t("scenarios")}</h2>
        </header>
        <div className="p-1.5">
          <ScenarioList scenarios={scenarios} selected={scenarioId} onSelect={setScenarioId} />
        </div>
      </aside>
      <div className={`${card} min-w-0 p-4`}>
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

function Actions({ data }: { data: RunDetails }) {
  const t = useTranslations("report");
  const tr = useTranslations("run");
  const te = useTranslations("errors");
  const router = useRouter();
  const rerun = useMutation(api.runs.rerun);
  const share = useMutation(api.runs.share);
  const cancel = useMutation(api.runs.cancel);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { run } = data;

  if (isActive(run.status)) {
    return (
      <>
        <button onClick={() => setConfirm(true)} className={button.danger}>
          <Square className="size-3.5" fill="currentColor" /> {tr("cancel")}
        </button>
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={() => void cancel({ runId: run._id })}
          title={tr("cancelTitle")}
          body={tr("cancelBody")}
          confirmLabel={tr("cancel")}
          cancelLabel={tr("keepRunning")}
        />
      </>
    );
  }

  async function onRerun() {
    try {
      const runId = await rerun({ runId: run._id });
      router.push(`/runs/${runId}`);
    } catch (e) {
      setError(te(errorKey(e)));
    }
  }
  async function onShare() {
    const token = await share({ runId: run._id });
    await navigator.clipboard.writeText(`${location.origin}/share/${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  function onMarkdown() {
    const md = toMarkdown(data, { duration: t("duration"), cost: t("cost") });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = `qagent-report-${run._id}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      {error && <p role="alert" className="w-full text-sm text-danger">{error}</p>}
      <button onClick={() => void onShare()} className={button.secondary} aria-live="polite">
        {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
        {copied ? t("copied") : t("share")}
      </button>
      <button onClick={() => void onRerun()} className={button.primary}>
        <RotateCcw className="size-4" /> {t("rerun")}
      </button>
      <Popover
        align="end"
        className="w-52"
        trigger={({ toggle, open }) => (
          <button onClick={toggle} aria-expanded={open} aria-label={t("more")} className={`${button.icon} size-9`}>
            <Ellipsis className="size-4" />
          </button>
        )}
      >
        {(close) => (
          <>
            <button onClick={() => { onMarkdown(); close(); }} className={menuItem}>
              <Download className="size-4" strokeWidth={1.75} /> {t("markdown")}
            </button>
            <button onClick={() => { close(); setTimeout(() => window.print(), 50); }} className={menuItem}>
              <Printer className="size-4" strokeWidth={1.75} /> {t("print")}
            </button>
          </>
        )}
      </Popover>
    </>
  );
}

function RunError({ error }: { error: string }) {
  const te = useTranslations("errors");
  const key = runErrorKey(error);
  return (
    <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
      {key ? te(key) : <>{te("generic")} <span dir="ltr" className="opacity-70">({error})</span></>}
    </div>
  );
}

export default function RunPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("report");
  const data = useQuery(api.runs.get, { runId: id as Id<"runs"> });
  if (!data) return <PageSkeleton />;
  const { run } = data;
  const active = isActive(run.status);

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 px-4 py-8 max-lg:pt-14 sm:px-8">
      <RunHeader data={data} actions={<Actions data={data} />} />
      {active && <StageTrack status={run.status} />}
      {run.error && <RunError error={run.error} />}
      {run.status === "canceled" && <p className="text-sm text-fg-3">{t("canceled")}</p>}
      {active ? <LiveView data={data} /> : <Report data={data} />}
    </div>
  );
}
