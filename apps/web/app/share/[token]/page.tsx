"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LogoBox } from "@/components/brand/LogoBox";
import { Report } from "@/components/Report";
import { PageSkeleton } from "@/components/RequireAuth";
import { button, card } from "@/components/ui";

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const t = useTranslations("report");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const data = useQuery(api.runs.getShared, { token });

  return (
    <div className="min-h-dvh bg-shell">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-shell/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-2 px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2 font-semibold">
            <LogoBox size={26} /> {tc("brand")}
          </Link>
          <Link href="/signin" className={button.primary}>{tc("tryFree")}</Link>
        </div>
      </header>
      {data === undefined ? (
        <PageSkeleton />
      ) : data === null ? (
        <main className="mx-auto max-w-md px-4 py-24">
          <p className={`${card} p-8 text-center text-sm text-fg-2`}>{te("notFound")}</p>
        </main>
      ) : (
        <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-6 sm:px-6">
          <div className="space-y-2">
            <p className="text-xs text-fg-3">{t("sharedBy")}</p>
            <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">{data.run.goal}</h1>
            <a href={data.run.url} target="_blank" rel="noreferrer" dir="ltr" className="inline-flex items-center gap-1 text-sm text-fg-3 hover:text-fg">
              <ExternalLink className="size-3.5" /> {data.run.url}
            </a>
          </div>
          <Report data={data} />
        </main>
      )}
    </div>
  );
}
