"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowRight, Bug, ExternalLink, History, Play, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ProjectAvatar } from "@/components/AppShell";
import { Composer, type Draft } from "@/components/Composer";
import { EmptyState } from "@/components/EmptyState";
import { BugHuntIllustration, CleanRunIllustration, LostIllustration } from "@/components/illustrations";
import { StatusBadge, TaskIcon } from "@/components/StatusBadge";
import { button, card, cardHeader, cardTitle, pill, skeleton, type Tone } from "@/components/ui";
import { hostOf, nf, timeAgo } from "@/lib/format";

type Overview = NonNullable<ReturnType<typeof useOverview>>;
const useOverview = (projectId: string) => useQuery(api.runs.projectOverview, { projectId });

const severityTone: Record<Overview["recentBugs"][number]["severity"], Tone> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "neutral",
};

/** A site's workspace: how it is doing, a new test against it, and everything run on it so far. */
export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const data = useOverview(id);

  if (data === undefined) return <ProjectSkeleton />;
  if (data === null) return <NotFound />;
  return <Project data={data} />;
}

function Project({ data }: { data: Overview }) {
  const t = useTranslations("project");
  const { project, runs, totals, recentBugs } = data;
  const [draft, setDraft] = useState<Draft>({ path: "", goal: "" });

  const [tab, setTab] = useState<"new" | "history" | "bugs">("new");

  const fresh = runs.length === 0;
  const tabs = [
    { key: "new", label: t("newRun"), icon: Play, count: null },
    { key: "history", label: t("tabHistory"), icon: History, count: runs.length },
    { key: "bugs", label: t("tabBugs"), icon: Bug, count: recentBugs.length },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-8 px-4 py-8 max-lg:pt-14 sm:px-8">
      <header className="space-y-5">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded text-sm text-fg-3 transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent">
          <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
          {t("back")}
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <ProjectAvatar name={project.name} url={project.baseUrl} favicon={project.faviconUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[26px] leading-[1.3] font-bold"><bdi>{project.name}</bdi></h1>
            <a href={project.baseUrl} target="_blank" rel="noreferrer" dir="ltr"
              className="font-url mt-1 inline-flex items-center gap-1.5 rounded text-sm text-fg-3 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
            >
              {hostOf(project.baseUrl)}
              <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">{t("visit")}</span>
            </a>
          </div>
          <Link href="/settings" className={button.secondary}>
            <Settings2 className="size-4" strokeWidth={1.75} aria-hidden />
            {t("manage")}
          </Link>
        </div>
      </header>

      {!fresh && (
        <div role="tablist" className="-mt-3 flex gap-1 overflow-x-auto border-b border-line">
          {tabs.map(({ key, label, icon: Icon, count }) => {
            const on = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                id={`tab-${key}`}
                aria-selected={on}
                aria-controls={`panel-${key}`}
                onClick={() => setTab(key)}
                className={`-mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${on ? "border-accent text-fg" : key === "new" ? "border-transparent text-accent hover:bg-accent-soft/60" : "border-transparent text-fg-3 hover:text-fg"}`}
              >
                <Icon className="size-4" strokeWidth={1.9} aria-hidden />
                {label}
                {count !== null && <span className="rounded-full bg-fg/[0.06] px-1.5 text-[11px] text-fg-3">{nf.format(count)}</span>}
              </button>
            );
          })}
        </div>
      )}

      {tab === "new" && (
      <section role={fresh ? undefined : "tabpanel"} id="panel-new" aria-labelledby={fresh ? "new-run" : "tab-new"}>
        <h2 id="new-run" className="text-lg font-bold">{fresh ? t("firstRun") : t("newRun")}</h2>
        <p className="mt-1 mb-4 text-sm text-fg-2">{fresh ? t("firstRunHint") : t("newRunHint")}</p>
        <Composer site={project.baseUrl} draft={draft} setDraft={setDraft} />
      </section>
      )}

      {!fresh && tab === "history" && (
          <section role="tabpanel" id="panel-history" className={card} aria-labelledby="history">
            <header className={cardHeader}>
              <h2 id="history" className={cardTitle}>
                {t("history")} <span className="font-normal text-fg-3">{nf.format(runs.length)}</span>
              </h2>
            </header>
            <ul className="divide-y divide-line">
              {runs.map((r) => (
                <li key={r._id}>
                  <Link href={`/runs/${r._id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-fg/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
                    <TaskIcon status={r.status} bugs={r.summary?.bugs} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.goal}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-fg-3">
                        <span>{timeAgo(r.createdAt)}</span>
                        {r.summary && <span>· {t("scenariosOf", { passed: nf.format(r.summary.passed), total: nf.format(r.summary.total) })}</span>}
                        {new URL(r.url).pathname !== "/" && <span dir="ltr">· {new URL(r.url).pathname}</span>}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

      )}

      {!fresh && tab === "bugs" && (
          <section role="tabpanel" id="panel-bugs" className={card} aria-labelledby="bugs">
            <header className={cardHeader}>
              <h2 id="bugs" className={cardTitle}>{t("recentBugs")}</h2>
            </header>
            {recentBugs.length === 0 ? (
              totals.scenarios === 0 ? (
                <EmptyState art={<BugHuntIllustration className="w-36" />} title={t("noFinished")} body={t("noFinishedBody")} compact />
              ) : (
                <EmptyState art={<CleanRunIllustration className="w-32" />} title={t("noBugs")} body={t("noBugsBody")} compact />
              )
            ) : (
              <ul className="divide-y divide-line">
                {recentBugs.map((b) => (
                  <li key={b._id}>
                    <Link href={`/runs/${b.runId}`} className="block px-5 py-3.5 transition-colors hover:bg-fg/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
                      <span className="flex items-center justify-between gap-2">
                        <Severity severity={b.severity} />
                        <span className="text-xs text-fg-3">{timeAgo(b.foundAt)}</span>
                      </span>
                      <span className="mt-2 block text-sm leading-[1.8] text-pretty">{b.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
      )}
    </div>
  );
}

function Severity({ severity }: { severity: Overview["recentBugs"][number]["severity"] }) {
  const t = useTranslations("report");
  return <span className={pill(severityTone[severity])}>{t(`severity.${severity}`)}</span>;
}

/** Mirrors Project's returning-user layout (header, tabs, composer) box for box so the swap doesn't shift anything. */
function ProjectSkeleton() {
  const bar = `${skeleton} rounded-md`;
  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-8 px-4 py-8 max-lg:pt-14 sm:px-8" aria-busy>
      <header className="space-y-5">
        <div className="flex h-5 items-center gap-1.5">
          <div className={`${bar} size-4`} />
          <div className={`${bar} h-3.5 w-16`} />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className={`${skeleton} size-14 shrink-0`} />
          <div className="min-w-0 flex-1">
            <div className={`${bar} h-[34px] w-48 max-w-full`} />
            <div className={`${bar} mt-1 h-5 w-32`} />
          </div>
          <div className={`${skeleton} h-9 w-[104px] rounded-full`} />
        </div>
      </header>

      <div className="-mt-3 flex gap-1 border-b border-line">
        {[112, 124, 108].map((w) => (
          <div key={w} className="flex h-11 shrink-0 items-center px-4" style={{ width: w }}>
            <div className={`${bar} h-4 w-full`} />
          </div>
        ))}
      </div>

      <section>
        <div className="flex h-7 items-center"><div className={`${bar} h-5 w-28`} /></div>
        <div className="mt-1 mb-4 flex h-5 items-center"><div className={`${bar} h-3.5 w-64 max-w-full`} /></div>
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
          <div className="space-y-3 px-5 py-5">
            <div>
              <div className="flex h-6 items-center"><div className={`${bar} h-4 w-40`} /></div>
              <div className="mt-1 flex h-[25.2px] items-center"><div className={`${bar} h-3.5 w-72 max-w-full`} /></div>
            </div>
            <div className={`${skeleton} h-[76px] rounded-lg`} />
          </div>
          <div className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className={`${bar} me-1 h-4 w-20`} />
              <div className={`${skeleton} h-9 w-28 rounded-full`} />
              <div className={`${skeleton} h-9 w-36 rounded-full`} />
            </div>
          </div>
          <div className="flex items-center gap-3 bg-surface px-5 py-4">
            <div className={`${skeleton} h-11 w-32 rounded-full`} />
            <div className={`${bar} h-3.5 w-24`} />
          </div>
        </div>
      </section>
    </div>
  );
}

function NotFound() {
  const t = useTranslations("project");
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-20 text-center">
      <LostIllustration className="w-56" />
      <h1 className="mt-6 text-xl font-bold">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-sm text-sm leading-[1.9] text-pretty text-fg-2">{t("notFoundBody")}</p>
      <Link href="/dashboard" className={`${button.primary} mt-6`}>{t("toProjects")}</Link>
    </div>
  );
}
