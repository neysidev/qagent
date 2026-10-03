"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Report } from "@/components/Report";
import { PageSkeleton } from "@/components/RequireAuth";
import { card } from "@/components/ui";

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const t = useTranslations("report");
  const te = useTranslations("errors");
  const data = useQuery(api.runs.getShared, { token });

  return (
    <>
      <Header />
      {data === undefined ? (
        <PageSkeleton />
      ) : data === null ? (
        <main className="mx-auto max-w-xl px-4 py-24">
          <p className={`${card} p-8 text-center text-zinc-600 dark:text-zinc-400`}>{te("notFound")}</p>
        </main>
      ) : (
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">{t("sharedBy")}</p>
            <h1 className="text-xl font-semibold text-balance sm:text-2xl">{data.run.goal}</h1>
            <p dir="ltr" className="text-sm text-zinc-500">{data.run.url}</p>
          </div>
          <Report data={data} />
        </main>
      )}
    </>
  );
}
