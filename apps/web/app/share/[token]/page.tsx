"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LogoBox } from "@/components/brand/LogoBox";
import { EmptyState } from "@/components/EmptyState";
import { LostIllustration } from "@/components/illustrations";
import { Report } from "@/components/Report";
import { PageSkeleton } from "@/components/RequireAuth";
import { button, card } from "@/components/ui";
import { PageTitle } from "@/components/PageTitle";

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const t = useTranslations("report");
  const tc = useTranslations("common");
  const te = useTranslations("errors");
  const data = useQuery(api.runs.getShared, { token });

  return (
    <div className="theme-light min-h-dvh bg-surface">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-md">
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
          <div className={card}><EmptyState art={<LostIllustration className="w-52" />} title={te("notFoundTitle")} body={te("notFound")} /></div>
        </main>
      ) : (
        <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-6 sm:px-6">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-xs text-fg-3">
              {data.brand?.logo && <img src={data.brand.logo} alt="" className="h-6 w-auto rounded" />}
              {data.brand ? data.brand.name : t("sharedBy")}
            </p>
            <PageTitle title={data.run.goal} />
            <h1 className="text-xl leading-[1.35] font-bold text-balance sm:text-[26px]">{data.run.goal}</h1>
            <a href={data.run.url} target="_blank" rel="noreferrer" dir="ltr" className="font-url inline-flex items-center gap-1 text-sm text-fg-3 hover:text-fg">
              <ExternalLink className="size-3.5" /> {data.run.url}
            </a>
          </div>
          <Report data={data} />
        </main>
      )}
    </div>
  );
}
