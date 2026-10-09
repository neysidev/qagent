"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { EmptyState } from "@/components/EmptyState";
import { CleanRunIllustration } from "@/components/illustrations";
import { StatusBadge } from "@/components/StatusBadge";
import { card, cardHeader, cardTitle, input, pill, skeleton, type Tone } from "@/components/ui";
import { diffRuns } from "@/lib/diff";
import { hostOf, nf, timeAgo } from "@/lib/format";
import { PageTitle } from "@/components/PageTitle";

const sevTone: Record<string, Tone> = { critical: "danger", high: "danger", medium: "warning", low: "neutral" };

function Group({ title, tone, items }: { title: string; tone: Tone; items: { title: string; hint?: string }[] }) {
  if (!items.length) return null;
  return (
    <section className={card}>
      <header className={cardHeader}>
        <h2 className={cardTitle}>
          {title} <span className={pill(tone)}>{nf.format(items.length)}</span>
        </h2>
      </header>
      <ul className="divide-y divide-line">
        {items.map((i, n) => (
          <li key={n} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <span className="min-w-0 text-pretty">{i.title}</span>
            {i.hint && <span className="shrink-0 text-xs text-fg-3">{i.hint}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ComparePage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("compare");
  const ts = useTranslations("status");
  const tr = useTranslations("report");
  const router = useRouter();
  const withId = useSearchParams().get("with");
  const current = useQuery(api.runs.get, { runId: id as Id<"runs"> });
  const overview = useQuery(api.runs.projectOverview, current ? { projectId: current.run.projectId } : "skip");

  // Candidates: finished runs of this project; default to the one just before this run, else the newest other one.
  const others = useMemo(() => (overview?.runs ?? []).filter((r) => r._id !== id && r.status === "done"), [overview, id]);
  const defaultId = useMemo(() => {
    if (!current) return null;
    return (others.find((r) => r.createdAt < current.run.createdAt) ?? others[0])?._id ?? null;
  }, [others, current]);
  const otherId = (withId as Id<"runs"> | null) ?? defaultId;
  const other = useQuery(api.runs.get, otherId ? { runId: otherId } : "skip");

  const diff = useMemo(() => {
    if (!current || !other) return null;
    const [older, newer] = current.run.createdAt <= other.run.createdAt ? [current, other] : [other, current];
    return diffRuns(older, newer);
  }, [current, other]);

  const back = (
    <Link href={`/runs/${id}`} className="inline-flex items-center gap-1.5 rounded text-sm text-fg-3 transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent">
      <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden /> {t("back")}
    </Link>
  );

  return (
    <div className="mx-auto max-w-[860px] space-y-5 px-4 py-8 max-lg:pt-14 sm:px-8">
      {back}
      <PageTitle title={t("title")} />
      <h1 className="text-[28px] leading-[1.3] font-bold">{t("title")}</h1>

      {current === undefined || overview === undefined ? (
        <div className={`${skeleton} h-40`} />
      ) : !otherId ? (
        <div className={card}><EmptyState art={<CleanRunIllustration className="w-44" />} title={t("none")} /></div>
      ) : (
        <>
          <label className="flex flex-wrap items-center gap-3 text-sm text-fg-2">
            {t("with")}
            <select value={otherId} onChange={(e) => router.replace(`/runs/${id}/compare?with=${e.target.value}`)} className={`${input} h-9 w-auto max-w-full pe-8`}>
              {others.map((r) => (
                <option key={r._id} value={r._id}>
                  {hostOf(r.url)} | {timeAgo(r.createdAt)} | {r.summary ? `${nf.format(r.summary.passed)}/${nf.format(r.summary.total)}` : ts(r.status)}
                </option>
              ))}
            </select>
          </label>

          {diff === null ? (
            <div className={`${skeleton} h-40`} />
          ) : (
            <div className="space-y-4">
              <Group title={t("regressed")} tone="danger" items={diff.regressed.map((s) => ({ title: s.title, hint: `${tr("scenarios")}` }))} />
              <Group title={t("newBugs")} tone="danger" items={diff.newBugs.map((b) => ({ title: b.title, hint: b.severity }))} />
              <Group title={t("fixed")} tone="success" items={diff.fixed.map((s) => ({ title: s.title }))} />
              <Group title={t("resolvedBugs")} tone="success" items={diff.resolvedBugs.map((b) => ({ title: b.title, hint: b.severity }))} />
              <Group title={t("persisting")} tone="warning" items={diff.persistingBugs.map((b) => ({ title: b.title, hint: b.severity }))} />
              <Group title={t("added")} tone="accent" items={diff.added.map((s) => ({ title: s.title, hint: s.status }))} />
              <Group title={t("removed")} tone="neutral" items={diff.removed.map((s) => ({ title: s.title }))} />
              <p className="text-sm text-fg-3">
                {diff.regressed.length + diff.fixed.length + diff.added.length + diff.removed.length + diff.newBugs.length + diff.resolvedBugs.length === 0 && t("identical")}
                {diff.same > 0 && <> {t("same", { n: diff.same })}</>}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
