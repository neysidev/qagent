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
  const { run, steps } = data;
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
