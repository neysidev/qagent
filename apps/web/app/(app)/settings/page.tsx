"use client";

import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import type { Doc } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { LogOut, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { ProjectAvatar, useWorkspace, type ProjectRow as ProjectRowData } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/overlay";
import { button, card, cardHeader, cardTitle, input, label, pill, skeleton } from "@/components/ui";
import { errorKey, nf, timeAgo } from "@/lib/format";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const viewer = useQuery(api.runs.viewer);
  const quota = useQuery(api.runs.quota);
  const te = useTranslations("errors");
  const { projects } = useWorkspace();
  const { signOut } = useAuthActions();
  const deleteProject = useMutation(api.runs.deleteProject);
  const [toDelete, setToDelete] = useState<ProjectRowData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(p: ProjectRowData) {
    setError(null);
    try {
      await deleteProject({ projectId: p._id });
    } catch (e) {
      setError(te(errorKey(e)));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 max-lg:pt-14 sm:px-8">
      <div className="pb-1">
        <h1 className="text-[28px] leading-[1.3] font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-fg-3">{t("subtitle")}</p>
      </div>

      <section className={card}>
        <header className={cardHeader}>
          <h2 className={cardTitle}>{t("account")}</h2>
        </header>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className={label}>{t("email")}</span>
            {viewer === undefined ? <div className={`${skeleton} h-9`} /> : <input readOnly disabled value={viewer?.email ?? ""} dir="ltr" className={input} />}
          </label>
          <div className="space-y-1.5">
            <span className={label}>{t("plan")}</span>
            <p className="flex h-9 items-center">
              <span className={pill("accent")}>{viewer?.plan ?? "free"}</span>
            </p>
          </div>
        </div>
        <footer className="flex justify-end border-t border-line px-4 py-3">
          <button onClick={() => void signOut()} className={button.danger}>
            <LogOut className="size-4" /> {t("signOut")}
          </button>
        </footer>
      </section>

      <section className={card}>
        <header className={cardHeader}>
          <h2 className={cardTitle}>{t("usage")}</h2>
        </header>
        <div className="p-4">
          {quota ? (
            <>
              <p className="flex items-baseline justify-between text-sm text-fg-2">
                {t("dailyRuns")}
                <span className="font-mono text-fg">
                  {nf.format(quota.used)} / {nf.format(quota.limit)}
                </span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-pixel-off">
                <div
                  className={`h-full rounded-full ${quota.used >= quota.limit ? "bg-danger" : "bg-accent"}`}
                  style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-fg-3">{t("resets")}</p>
            </>
          ) : (
            <div className={`${skeleton} h-12`} />
          )}
        </div>
      </section>

      <section className={card}>
        <header className={cardHeader}>
          <h2 className={cardTitle}>
            {t("projects")} <span className="font-mono text-fg-3">{projects?.length ?? ""}</span>
          </h2>
        </header>
        {projects === undefined ? (
          <div className="space-y-2 p-4">
            <div className={`${skeleton} h-10`} />
            <div className={`${skeleton} h-10`} />
          </div>
        ) : projects.length === 0 ? (
          <p className="p-8 text-center text-sm text-fg-3">{t("noProjects")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {projects.map((p) => (
              <ProjectRow
                key={p._id}
                project={p}
                tasks={p.runCount}
                lastAt={p.lastRun?.createdAt}
                onDelete={() => setToDelete(p)}
              />
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className="border-t border-line px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <ConfirmDialog
          open={toDelete !== null}
          onClose={() => setToDelete(null)}
          onConfirm={() => toDelete && void onDelete(toDelete)}
          title={t("deleteTitle", { name: toDelete?.name ?? "" })}
          body={t("deleteBody", { n: toDelete?.runCount ?? 0 })}
          confirmLabel={t("delete")}
          cancelLabel={t("keep")}
        />
      </section>
    </div>
  );
}

function ProjectRow({
  project,
  tasks,
  lastAt,
  onDelete,
}: {
  project: Doc<"projects">;
  tasks: number;
  lastAt?: number;
  onDelete: () => void;
}) {
  const t = useTranslations("settings");
  const te = useTranslations("errors");
  const rename = useMutation(api.runs.renameProject);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await rename({ projectId: project._id, name });
      setEditing(false);
    } catch (err) {
      setError(te(errorKey(err)));
    } finally {
      setPending(false);
    }
  }

  if (editing)
    return (
      <li className="px-4 py-3">
        <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
          <ProjectAvatar name={name || project.name} url={project.baseUrl} />
          <label className="min-w-40 flex-1">
            <span className="sr-only">{t("projectName")}</span>
            <input
              autoFocus
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
              aria-invalid={error ? true : undefined}
              className={input}
            />
          </label>
          <button type="button" onClick={() => setEditing(false)} className={`${button.ghost} h-8 text-xs`}>
            {t("cancel")}
          </button>
          <button disabled={pending || !name.trim() || name.trim() === project.name} className={`${button.primary} h-8 text-xs`}>
            {t("save")}
          </button>
        </form>
        {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
      </li>
    );

  return (
    <li className="group flex items-center gap-3 px-4 py-3">
      <ProjectAvatar name={project.name} url={project.baseUrl} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-fg">{project.name}</span>
        <span className="block text-xs text-fg-3">
          <span dir="ltr" className="font-url">{project.baseUrl.replace(/^https?:\/\//, "")}</span> · {t("projectMeta", { n: tasks })}
          {lastAt && <> · {timeAgo(lastAt)}</>}
        </span>
      </span>
      <Link href={`/projects/${project._id}`} className={`${button.secondary} h-8 text-xs`}>
        {t("focus")}
      </Link>
      <button
        onClick={() => {
          setName(project.name);
          setEditing(true);
        }}
        aria-label={t("rename")}
        title={t("rename")}
        className={button.icon}
      >
        <Pencil className="size-3.5" />
      </button>
      <button onClick={onDelete} aria-label={t("delete")} title={t("delete")} className={`${button.icon} hover:border-danger/30 hover:bg-danger-soft hover:text-danger`}>
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}
