"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowRight, Bug, ExternalLink, Gauge, ListChecks, Play, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ProjectAvatar } from "@/components/AppShell";
import { Composer, type Draft } from "@/components/Composer";
import { LostIllustration } from "@/components/illustrations";
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
  const [draft, setDraft] = useState<Draft>({ path: "", goal: "", template: null });

  const fresh = runs.length === 0;
  const stats = [
    { label: t("statRuns"), value: nf.format(totals.runs), icon: Play, tone: "bg-accent-soft text-accent" },
    { label: t("statScenarios"), value: totals.scenarios ? `${nf.format(totals.passed)}/${nf.format(totals.scenarios)}` : "—", icon: ListChecks, tone: "bg-[#0090ff]/10 text-[#0077d4]" },
    { label: t("statPassRate"), value: totals.scenarios ? `${nf.format(Math.round((totals.passed / totals.scenarios) * 100))}٪` : "—", icon: Gauge, tone: "bg-success-soft text-success" },
    { label: t("statBugs"), value: nf.format(totals.bugs), icon: Bug, tone: totals.bugs ? "bg-warning-soft text-warning" : "bg-fg/[0.06] text-fg-3" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-8 px-4 py-8 max-lg:pt-14 sm:px-8">
      <header className="space-y-5">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded text-sm text-fg-3 transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent">
          <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
          {t("back")}
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <ProjectAvatar name={project.name} url={project.baseUrl} size="lg" />
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
        {!fresh && (
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
                <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${s.tone}`}>
                  <s.icon className="size-[18px]" strokeWidth={1.9} aria-hidden />
                </span>
                <span className="min-w-0">
                  <dt className="truncate text-xs text-fg-3">{s.label}</dt>
                  <dd className="mt-0.5 text-xl font-bold text-fg">{s.value}</dd>
                </span>
              </div>
            ))}
          </dl>
        )}
      </header>

      <section aria-labelledby="new-run">
        <h2 id="new-run" className="text-lg font-bold">{fresh ? t("firstRun") : t("newRun")}</h2>
        <p className="mt-1 mb-4 text-sm text-fg-2">{fresh ? t("firstRunHint") : t("newRunHint")}</p>
        <Composer site={project.baseUrl} draft={draft} setDraft={setDraft} />
      </section>

      {!fresh && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className={card} aria-labelledby="history">
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

          <section className={`${card} self-start`} aria-labelledby="bugs">
            <header className={cardHeader}>
              <h2 id="bugs" className={cardTitle}>{t("recentBugs")}</h2>
            </header>
            {recentBugs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-fg-3">{t("noBugs")}</p>
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
        </div>
      )}
    </div>
  );
}

function Severity({ severity }: { severity: Overview["recentBugs"][number]["severity"] }) {
  const t = useTranslations("report");
  return <span className={pill(severityTone[severity])}>{t(`severity.${severity}`)}</span>;
}

function ProjectSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1080px] space-y-8 px-4 py-8 max-lg:pt-14 sm:px-8" aria-busy>
      <div className={`${skeleton} h-4 w-20`} />
      <div className="flex items-center gap-4">
        <div className={`${skeleton} size-14 rounded-xl`} />
        <div className="space-y-2">
          <div className={`${skeleton} h-6 w-48`} />
          <div className={`${skeleton} h-4 w-32`} />
        </div>
      </div>
      <div className={`${skeleton} h-24 rounded-xl`} />
      <div className={`${skeleton} h-56 rounded-xl`} />
      <div className={`${skeleton} h-72 rounded-xl`} />
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
