"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Link } from "@/i18n/routing";

function Run({ runId }: { runId: Id<"runs"> }) {
  const t = useTranslations("run");
  const data = useQuery(api.runs.get, { runId });
  if (!data) return null;
  const { run, steps, scenarios, bugs } = data;
  const latest = steps.at(-1);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <Link href="/dashboard" className="text-sm text-zinc-500">
        {t("back")}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{run.goal}</h1>
        <StatusBadge status={run.status} />
      </div>
      <p className="text-sm text-zinc-500" dir="ltr">
        {run.url}
      </p>
      {run.error && <p role="alert" className="text-sm text-red-600">{run.error}</p>}
      {run.cost && (
        <p className="text-sm text-zinc-500">
          {t("cost")}: <span dir="ltr">${run.cost.usd.toFixed(4)} · {run.cost.llmCalls} LLM</span>
        </p>
      )}
      {run.summaryText && <p className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">{run.summaryText}</p>}

      {scenarios.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">{t("scenarios")}</h2>
          <ul className="space-y-2">
            {scenarios.map((s) => (
              <li key={s._id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{s.title}</span>
                  <span className="text-xs text-zinc-500">{t(`scenario.${s.status}`)}</span>
                </div>
                {s.verdictReason && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.verdictReason}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {bugs.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">{t("bugs")}</h2>
          <ul className="space-y-3">
            {bugs.map((b) => (
              <li key={b._id} className="rounded-lg border border-red-200 p-4 dark:border-red-900">
                <p className="font-medium">
                  <span className="me-2 rounded bg-red-100 px-1.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                    {b.severity}
                  </span>
                  {b.title}
                </p>
                <ol className="mt-2 list-decimal ps-5 text-sm">
                  {b.reproSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                <p className="mt-2 text-sm"><strong>{t("expected")}:</strong> {b.expected}</p>
                <p className="text-sm"><strong>{t("actual")}:</strong> {b.actual}</p>
                {[...b.evidence.networkErrors.map((n) => `${n.method} ${n.url} → ${n.status}`), ...b.evidence.consoleErrors].map(
                  (line, i) => (
                    <code key={i} dir="ltr" className="mt-1 block truncate text-xs text-red-600">{line}</code>
                  ),
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {latest?.screenshotUrl ? (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={latest.screenshotUrl}
            alt={latest.thought}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
          />
          <figcaption className="text-sm text-zinc-600 dark:text-zinc-400">{latest.thought}</figcaption>
        </figure>
      ) : (
        <div className="grid aspect-[16/10] place-items-center rounded-lg border border-dashed border-zinc-300 text-zinc-500 dark:border-zinc-700">
          {t("waiting")}
        </div>
      )}

      {steps.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">{t("steps")}</h2>
          <ol className="list-decimal space-y-1 ps-5 text-sm">
            {steps.map((s) => (
              <li key={s._id}>
                <code dir="ltr">{s.action.type}</code> — {s.thought}
              </li>
            ))}
          </ol>
        </section>
      )}
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
