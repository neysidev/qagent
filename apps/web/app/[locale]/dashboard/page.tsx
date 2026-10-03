"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Header } from "@/components/Header";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { button, card, skeleton } from "@/components/ui";
import { Link, useRouter, type Locale } from "@/i18n/routing";
import { errorKey } from "@/lib/format";

const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_SHOP_URL ?? "";

function Dashboard() {
  const t = useTranslations("dashboard");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const runs = useQuery(api.runs.listMine);
  const quota = useQuery(api.runs.quota);
  const createRun = useMutation(api.runs.create);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  async function tryDemo() {
    setError(null);
    setPending(true);
    try {
      const runId = await createRun({ url: DEMO_URL, goal: t("demoGoal"), templateKey: "cart", locale });
      router.push(`/runs/${runId}`);
    } catch (e) {
      setError(te(errorKey(e)));
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          {quota && (
            <p className={`mt-1 text-sm ${quota.used >= quota.limit ? "text-red-600" : "text-zinc-500"}`}>
              {t("quota", { used: quota.used, limit: quota.limit })}
            </p>
          )}
        </div>
        <Link href="/tests/new" className={button.primary}>
          + {t("newTest")}
        </Link>
      </div>

      {DEMO_URL && (
        <section className="flex flex-col gap-4 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-pretty text-blue-50">{t("tryDemoBody")}</p>
          <button
            disabled={pending || (quota !== undefined && quota.used >= quota.limit)}
            onClick={() => void tryDemo()}
            className={`${button.primary} shrink-0 bg-white px-6 py-3 text-base text-blue-700 hover:bg-blue-50 dark:bg-white dark:text-blue-700`}
          >
            {pending && <span className="size-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" aria-hidden />}
            {t("tryDemo")}
          </button>
        </section>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="mb-3 font-semibold">{t("recentRuns")}</h2>
        {runs === undefined ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`${skeleton} h-16`} />
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className={`${card} px-6 py-12 text-center`}>
            <p className="font-medium">{t("noRuns")}</p>
            <p className="mt-1 text-sm text-zinc-500">{t("noRunsBody")}</p>
          </div>
        ) : (
          <ul className={`${card} divide-y divide-zinc-200 dark:divide-zinc-800`}>
            {runs.map((run) => (
              <li key={run._id}>
                <Link
                  href={`/runs/${run._id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{run.goal}</span>
                    <span className="mt-0.5 flex gap-2 text-xs text-zinc-500">
                      <span dir="ltr" className="truncate">{new URL(run.url).host}</span>
                      <span>·</span>
                      <span className="shrink-0">{dateFormat.format(run.createdAt)}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    {run.summary && (
                      <span className={`text-xs max-sm:hidden ${run.summary.bugs ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}>
                        {t("bugs", { count: run.summary.bugs })}
                      </span>
                    )}
                    <StatusBadge status={run.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Header />
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    </>
  );
}
