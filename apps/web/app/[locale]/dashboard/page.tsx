"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Header } from "@/components/Header";
import { RequireAuth } from "@/components/RequireAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Link, useRouter, type Locale } from "@/i18n/routing";

const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_SHOP_URL ?? "";

function Dashboard() {
  const t = useTranslations("dashboard");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const runs = useQuery(api.runs.listMine);
  const createRun = useMutation(api.runs.create);
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function start(runUrl: string, runGoal: string) {
    setError(null);
    setPending(true);
    try {
      const runId = await createRun({ url: runUrl, goal: runGoal, locale });
      router.push(`/runs/${runId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
      setPending(false);
    }
  }

  const input =
    "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700 focus:outline-2 focus:outline-blue-500";

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      {DEMO_URL && (
        <button
          disabled={pending}
          onClick={() => void start(DEMO_URL, t("demoGoal"))}
          className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {t("tryDemo")}
        </button>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void start(url, goal);
        }}
        className="space-y-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
      >
        <h2 className="text-lg font-semibold">{t("newTest")}</h2>
        <label className="block space-y-1">
          <span className="text-sm">{t("url")}</span>
          <input
            type="url"
            required
            dir="ltr"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={input}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm">{t("goal")}</span>
          <textarea
            required
            rows={3}
            maxLength={2000}
            placeholder={t("goalPlaceholder")}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className={input}
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {t("start")}
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("recentRuns")}</h2>
        {runs?.length === 0 && <p className="text-zinc-500">{t("noRuns")}</p>}
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {runs?.map((run) => (
            <li key={run._id}>
              <Link href={`/runs/${run._id}`} className="flex items-center justify-between gap-4 py-3 hover:opacity-80">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{run.goal}</span>
                  <span className="block truncate text-sm text-zinc-500" dir="ltr">
                    {run.url}
                  </span>
                </span>
                <StatusBadge status={run.status} />
              </Link>
            </li>
          ))}
        </ul>
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
