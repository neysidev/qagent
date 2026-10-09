"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectAvatar, useWorkspace, type ProjectRow } from "@/components/AppShell";
import { DEMO_URL } from "@/components/Composer";
import { SitesIllustration } from "@/components/illustrations";
import { TaskIcon } from "@/components/StatusBadge";
import { skeleton } from "@/components/ui";
import { errorKey, hostOf, timeAgo } from "@/lib/format";

/** Start: type an address, land in that site's project. Existing projects sit right below. */
export default function Start() {
  const t = useTranslations("home");
  const { projects } = useWorkspace();

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pt-16 pb-16 sm:px-8 sm:pt-[12vh]">
      <div className="mx-auto max-w-[560px] text-center">
        <h1 className="text-[26px] leading-[1.3] font-bold sm:text-[34px]">{t("title")}</h1>
        <p className="mt-3 text-fg-2">{t("subtitle")}</p>
      </div>
      <AddressForm />

      <section className="mt-16" aria-labelledby="projects-heading">
        <h2 id="projects-heading" className="mb-4 text-sm font-bold text-fg-2">{t("yourProjects")}</h2>
        {projects === undefined ? (
          <div className="grid gap-1.5 rounded-[28px] border border-line bg-surface p-1.5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <div key={i} className={`${skeleton} h-[118px] rounded-[22px] bg-card`} />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center rounded-[28px] border border-line bg-surface px-6 py-12 text-center">
            <SitesIllustration className="w-56" />
            <p className="mt-6 font-bold">{t("emptyTitle")}</p>
            <p className="mt-2 max-w-sm text-sm leading-[1.9] text-pretty text-fg-2">{t("emptyBody")}</p>
          </div>
        ) : (
          <ul className="grid gap-1.5 rounded-[28px] border border-line bg-surface p-1.5 sm:grid-cols-2">
            {projects.map((p) => <ProjectCard key={p._id} project={p} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function AddressForm() {
  const t = useTranslations("home");
  const te = useTranslations("errors");
  const router = useRouter();
  const openProject = useMutation(api.runs.openProject);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function open(address: string) {
    if (!address.trim() || pending) return;
    setError(null);
    setPending(true);
    try {
      router.push(`/projects/${await openProject({ url: address })}`);
    } catch (err) {
      setError(te(errorKey(err)));
      setPending(false);
    }
  }

  return (
    <div className="mx-auto mt-9 max-w-[560px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void open(url);
        }}
        className="flex items-center gap-2 rounded-full border border-line-strong bg-card p-1.5 ps-5 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.25)] transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft),0_16px_40px_-16px_rgb(0_0_0/0.25)]"
      >
        <label className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="sr-only">{t("urlLabel")}</span>
          <input
            autoFocus
            inputMode="url"
            autoComplete="url"
            dir="ltr"
            spellCheck={false}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="example.com"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "address-error" : undefined}
            className="h-11 min-w-0 flex-1 bg-transparent text-[16px] text-fg placeholder:text-fg-3 focus:outline-none"
          />
          <Globe className="size-5 shrink-0 text-fg-3" strokeWidth={1.75} aria-hidden />
        </label>
        <button
          disabled={!url.trim() || pending}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white shadow-[0_8px_20px_-10px_var(--accent)] transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97] disabled:opacity-40"
        >
          {pending ? <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden /> : null}
          {t("open")}
          {!pending && <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />}
        </button>
      </form>
      {error ? (
        <p id="address-error" role="alert" className="mt-3 text-center text-sm text-danger">{error}</p>
      ) : (
        DEMO_URL && (
          <p className="mt-3 text-center text-sm text-fg-3">
            {t("orDemo")}{" "}
            <button type="button" onClick={() => void open(DEMO_URL)} disabled={pending}
              className="rounded font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {t("demo")}
            </button>{" "}
            {t("orDemoAfter")}
          </p>
        )
      )}
    </div>
  );
}

function ProjectCard({ project: p }: { project: ProjectRow }) {
  const t = useTranslations("home");
  const last = p.lastRun;
  return (
    <li>
      <Link
        href={`/projects/${p._id}`}
        className="group flex h-full flex-col rounded-[22px] bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow duration-200 hover:shadow-[0_12px_28px_-14px_rgb(0_0_0/0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="flex items-center gap-3">
          <ProjectAvatar name={p.name} url={p.baseUrl} favicon={p.faviconUrl} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold"><bdi>{p.name}</bdi></span>
            {p.name !== hostOf(p.baseUrl) && <span className="font-url mt-0.5 block truncate text-xs text-fg-3"><bdi>{hostOf(p.baseUrl)}</bdi></span>}
          </span>
          <ArrowLeft className="size-4 text-fg-3 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden />
        </span>
        <span className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs text-fg-2">
          {last ? (
            <>
              <TaskIcon status={last.status} bugs={last.summary?.bugs} />
              <span className="min-w-0 flex-1 truncate">{t("lastRun", { time: timeAgo(last.createdAt) })}</span>
              <span className="shrink-0 text-fg-3">{t("runsN", { n: p.runCount })}</span>
              {last.summary && last.summary.bugs > 0 && (
                <span className="shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-warning">{t("bugsN", { n: last.summary.bugs })}</span>
              )}
            </>
          ) : (
            <span className="text-fg-3">{t("neverRun")}</span>
          )}
        </span>
      </Link>
    </li>
  );
}
