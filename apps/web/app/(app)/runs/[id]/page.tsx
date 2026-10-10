"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { RunDetails } from "@convex/runs";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Check, Clock, Download, FileText, Hourglass, Play, Route, ShieldCheck, Ellipsis, ExternalLink, GitCompareArrows, Link2, Printer, RotateCcw, Square } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmDialog, menuItem, Popover } from "@/components/overlay";
import { LostIllustration } from "@/components/illustrations";
import { PendingScene } from "@/components/PendingScene";
import { BugActions } from "@/components/BugActions";
import { ExportDialog } from "@/components/ExportDialog";
import { Report } from "@/components/Report";
import { ShareDialog } from "@/components/ShareDialog";
import { isActive, StatusBadge } from "@/components/StatusBadge";
import { StepViewer } from "@/components/StepViewer";
import { button, card, cardHeader, skeleton } from "@/components/ui";
import { useWorkerOnline } from "@/lib/useWorkerOnline";
import { errorKey, formatDuration, hostOf, runDuration, runErrorKey } from "@/lib/format";
import { PageTitle } from "@/components/PageTitle";

function useNow(ticking: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ticking]);
  return now;
}

function Ticker({ value }: { value: string }) {
  return (
    <span dir="ltr" className="inline-flex text-fg" aria-label={value}>
      {[...value].map((ch, i) => (
        <span key={i} aria-hidden className={`inline-block text-center ${/\d|[۰-۹]/.test(ch) ? "w-[0.62em]" : "w-[0.35em]"}`}>{ch}</span>
      ))}
    </span>
  );
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
        <span dir="ltr" className="font-url">{hostOf(run.url)}</span>
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
              className="font-url inline-flex min-w-0 items-center gap-1 truncate text-sm text-fg-3 transition-colors hover:text-fg"
            >
              <ExternalLink className="size-3.5 shrink-0" />
              <span className="truncate">{run.url}</span>
            </a>
          </div>
          <PageTitle title={run.goal} />
          <h1 className="text-xl leading-[1.35] font-bold text-balance sm:text-[26px]">{run.goal}</h1>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-fg-3">
          <Clock className="size-3.5" /> {t("elapsed")}
          <Ticker value={formatDuration(runDuration(run, now))} />
        </span>
      </div>
    </div>
  );
}

const STAGE_ICONS = { queued: Hourglass, planning: Route, running: Play, verifying: ShieldCheck, reporting: FileText } as const;

function StageTrack({ status }: { status: RunDetails["run"]["status"] }) {
  const t = useTranslations("status");
  const tr = useTranslations("run");
  const current = Math.max(0, STAGES.indexOf(status as (typeof STAGES)[number]));
  const stage = STAGES[current];
  return (
    <section className={`${card} px-5 pt-5 pb-4`}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-bold">
          <span className="relative flex size-2.5" aria-hidden>
            <span className="absolute inset-0 animate-ping rounded-full bg-accent/60 motion-reduce:animate-none" />
            <span className="relative size-2.5 rounded-full bg-accent" />
          </span>
          {tr(`stageHint.${stage}`)}
        </p>
        <span className="shrink-0 text-xs text-fg-3">{tr("stageOf", { n: (current + 1).toLocaleString("fa-IR"), total: STAGES.length.toLocaleString("fa-IR") })}</span>
      </div>
      <ol className="relative mt-5 grid grid-cols-5">
        <span aria-hidden className="absolute inset-x-[10%] top-[18px] h-0.5 rounded-full bg-line-strong" />
        <span aria-hidden className="absolute start-[10%] top-[18px] h-0.5 rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out-strong)]"
          style={{ width: `${(current / (STAGES.length - 1)) * 80}%` }} />
        {STAGES.map((s, i) => {
          const done = i < current;
          const now = i === current;
          const Icon = done ? Check : STAGE_ICONS[s];
          return (
            <li key={s} aria-current={now ? "step" : undefined} className="relative flex flex-col items-center gap-2 text-center">
              <span className={`grid size-9 place-items-center rounded-full transition-[background-color,color,box-shadow] duration-300 ${
                done ? "bg-accent text-white" : now ? "bg-card text-accent shadow-[0_0_0_2px_var(--accent),0_0_0_6px_var(--accent-soft)]" : "bg-card text-fg-3 ring-1 ring-line-strong"
              }`}>
                <Icon className="size-4" strokeWidth={done ? 2.5 : 1.9} aria-hidden />
              </span>
              <span className={`text-xs ${now ? "font-bold text-fg" : done ? "text-fg-2" : "text-fg-3"}`}>{t(s)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function WorkerOffline() {
  const t = useTranslations("run.offline");
  return (
    <section role="status" className={`${card} flex flex-col items-center px-6 py-14 text-center`}>
      <LostIllustration className="w-52" />
      <h2 className="mt-6 text-lg font-bold">{t("title")}</h2>
      <p className="mt-2 max-w-md text-sm leading-[1.9] text-pretty text-fg-2">{t("body")}</p>
    </section>
  );
}

function LiveView({ data }: { data: RunDetails }) {
  const t = useTranslations("run");
  const workerOnline = useWorkerOnline();
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const { run, scenarios, steps } = data;

  if (scenarios.length === 0) {
    if (run.status === "queued" && workerOnline === false) return <WorkerOffline />;
    return <PendingScene status={run.status === "queued" ? "queued" : "planning"} host={hostOf(run.url)} />;
  }
  return (
    <div className={`${card} min-w-0 space-y-4 p-4 [--stage-h:max(18rem,calc(100dvh-34rem))]`}>
      <ScenarioChips scenarios={scenarios} selected={scenarioId} onSelect={setScenarioId} />
      <StepViewer
        key={scenarioId ?? "all"}
        steps={scenarioId ? steps.filter((s) => s.scenarioId === scenarioId) : steps}
        scenarios={scenarios}
        live
        runId={run._id}
      />
    </div>
  );
}

const chipDot: Record<RunDetails["scenarios"][number]["status"], string> = {
  pending: "bg-fg-3/50",
  running: "bg-accent animate-pulse",
  passed: "bg-success",
  failed: "bg-danger",
  error: "bg-warning",
  skipped: "bg-fg-3/50",
};

function ScenarioChips({ scenarios, selected, onSelect }: {
  scenarios: RunDetails["scenarios"];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const t = useTranslations("run");
  const chip = "inline-flex h-8 max-w-64 shrink-0 items-center gap-2 rounded-full border px-3 text-xs transition-colors duration-150 aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:text-fg";
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="group" aria-label={t("scenarios")}>
      <button type="button" aria-pressed={selected === null} onClick={() => onSelect(null)} className={`${chip} border-line-strong font-medium text-fg-2`}>
        {t("allScenarios")}
      </button>
      {scenarios.map((s) => (
        <button key={s._id} type="button" aria-pressed={selected === s._id} onClick={() => onSelect(s._id)} title={s.title}
          className={`${chip} animate-rise border-line text-fg-2 hover:border-line-strong`}
        >
          <span className={`size-2 shrink-0 rounded-full ${chipDot[s.status]}`} aria-hidden />
          <span className="truncate">{s.title}</span>
        </button>
      ))}
    </div>
  );
}

function Actions({ data }: { data: RunDetails }) {
  const t = useTranslations("report");
  const tr = useTranslations("run");
  const tc = useTranslations("compare");
  const te = useTranslations("errors");
  const te2 = useTranslations("export");
  const router = useRouter();
  const rerun = useMutation(api.runs.rerun);
  const cancel = useMutation(api.runs.cancel);
  const [confirm, setConfirm] = useState(false);
  const [dialog, setDialog] = useState<"share" | "export" | null>(null);
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
  return (
    <>
      {error && <p role="alert" className="w-full text-sm text-danger">{error}</p>}
      <button onClick={() => setDialog("share")} className={button.secondary}>
        <Link2 className="size-4" /> {t("share")}
      </button>
      <button onClick={() => setDialog("export")} className={button.secondary}>
        <Download className="size-4" /> {te2("trigger")}
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
            <Link href={`/runs/${run._id}/compare`} onClick={close} className={menuItem}>
              <GitCompareArrows className="size-4" strokeWidth={1.75} /> {tc("menu")}
            </Link>
            <button onClick={() => { close(); setTimeout(() => window.print(), 50); }} className={menuItem}>
              <Printer className="size-4" strokeWidth={1.75} /> {t("print")}
            </button>
          </>
        )}
      </Popover>
      <ShareDialog open={dialog === "share"} onClose={() => setDialog(null)} run={run} />
      <ExportDialog open={dialog === "export"} onClose={() => setDialog(null)} data={data} />
    </>
  );
}

function RunError({ error }: { error: string }) {
  const te = useTranslations("errors");
  return (
    <div role="alert" className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
      {te(runErrorKey(error))}
    </div>
  );
}

function RunSkeleton() {
  const bar = `${skeleton} rounded-md`;
  return (
    <div className="mx-auto max-w-[1280px] space-y-5 px-4 py-8 max-lg:pt-14 sm:px-8" aria-busy>
      <div className="space-y-4">
        <div className="flex h-5 items-center gap-1.5">
          <div className={`${bar} size-4`} />
          <div className={`${bar} h-3.5 w-32`} />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex h-5 items-center gap-2">
              <div className={`${skeleton} h-5 w-16 rounded-full`} />
              <div className={`${bar} h-3.5 w-56 max-w-full`} />
            </div>
            <div className="flex h-[27px] items-center sm:h-[35.1px]"><div className={`${bar} h-5 w-3/4 sm:h-6`} /></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`${skeleton} h-9 w-24 rounded-full`} />
            <div className={`${skeleton} h-9 w-28 rounded-full`} />
            <div className={`${skeleton} size-9 rounded-full`} />
          </div>
        </div>
        <div className={`${skeleton} h-[30px] w-36 rounded-lg`} />
      </div>

      <div className="space-y-4">
        <section className={card}>
          <header className={cardHeader}><div className={`${bar} h-4 w-24`} /></header>
          <div className="space-y-2 p-4">
            <div className={`${bar} h-4 w-full`} />
            <div className={`${bar} h-4 w-2/3`} />
          </div>
        </section>
        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className={`${card} h-fit`}>
            <header className={cardHeader}><div className={`${bar} h-4 w-20`} /></header>
            <div className="space-y-1 p-1.5">
              {[0, 1, 2, 3].map((i) => <div key={i} className={`${skeleton} h-14 rounded-lg`} />)}
            </div>
          </div>
          <div className={`${card} min-w-0 p-4`}>
            <div className={`${bar} mb-3 h-5 w-24`} />
            <div className="@container">
              <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className={`${skeleton} aspect-[16/10]`} />
                <div className={`${skeleton} min-h-72 @3xl:min-h-0`} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function RunPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("report");
  const data = useQuery(api.runs.get, { runId: id as Id<"runs"> });
  if (!data) return <RunSkeleton />;
  const { run } = data;
  const active = isActive(run.status);

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 px-4 py-8 max-lg:pt-14 sm:px-8">
      <RunHeader data={data} actions={<Actions data={data} />} />
      {active && <StageTrack status={run.status} />}
      {run.error && <RunError error={run.error} />}
      {run.status === "canceled" && <p className="text-sm text-fg-3">{t("canceled")}</p>}
      {active ? <LiveView data={data} /> : <Report data={data} bugActions={(bug) => <BugActions bug={bug} run={run} />} />}
    </div>
  );
}
