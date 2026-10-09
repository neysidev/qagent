"use client";

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Bell, Check, ChevronsUpDown, Layers, ListFilter, LogOut, PanelRight, Plus, Search, Settings, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hostOf, timeAgo } from "@/lib/format";
import { LogoBox } from "./brand/LogoBox";
import { PixelGrid } from "./brand/PixelGrid";
import { menuItem, Popover } from "./overlay";
import { TaskIcon } from "./StatusBadge";
import { button, skeleton } from "./ui";

type RunRow = NonNullable<ReturnType<typeof useRuns>>[number];
const useRuns = () => useQuery(api.runs.listMine);

type Workspace = {
  runs: RunRow[] | undefined;
  projects: Doc<"projects">[] | undefined;
  /** History filter; null = all projects */
  projectId: Id<"projects"> | null;
  project: Doc<"projects"> | null;
  setProjectId: (id: Id<"projects"> | null) => void;
};

const WorkspaceContext = createContext<Workspace | null>(null);
export const useWorkspace = () => useContext(WorkspaceContext)!;

const STORAGE_KEY = "qagent.project";
const SEEN_KEY = "qagent.notifSeen";

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("shell");
  const runs = useRuns();
  const projects = useQuery(api.runs.projects);
  const pathname = usePathname();
  const [projectId, setProjectIdState] = useState<Id<"projects"> | null>(null);
  /** Mobile: drawer open. Desktop: sidebar collapsed. */
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const setProjectId = (id: Id<"projects"> | null) => {
    setProjectIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id ?? "");
    } catch {}
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProjectIdState(saved as Id<"projects">);
    } catch {}
  }, []);

  useEffect(() => setDrawer(false), [pathname]);

  const project = projects?.find((p) => p._id === projectId) ?? null;
  const value = useMemo(
    () => ({ runs, projects, projectId: project ? projectId : null, project, setProjectId }),
    [runs, projects, projectId, project],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {/* Dark shell (sidebar + frame) around a white content panel, same black/white/orange as the landing. */}
      <div className="theme-dark flex h-dvh overflow-hidden bg-canvas text-fg [color-scheme:dark] print:block print:h-auto print:overflow-visible">
        {drawer && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setDrawer(false)} aria-hidden />}
        <aside
          className={`no-print drawer flex w-[272px] shrink-0 flex-col bg-canvas max-lg:fixed max-lg:inset-y-0 max-lg:start-0 max-lg:z-50 ${drawer ? "" : "max-lg:translate-x-full"} ${collapsed ? "lg:hidden" : ""}`}
        >
          <Sidebar onHide={() => (drawer ? setDrawer(false) : setCollapsed(true))} />
        </aside>
        <main className={`theme-light print-flat relative min-w-0 flex-1 overflow-y-auto bg-canvas text-fg [color-scheme:light] lg:my-2 lg:me-2 lg:rounded-[24px] lg:shadow-[0_0_0_1px_rgb(255_255_255/0.04)] ${collapsed ? "lg:ms-2" : ""}`}>
          <button
            onClick={() => {
              setDrawer(true);
              setCollapsed(false);
            }}
            aria-label={t("showSidebar")}
            className={`${button.icon} no-print absolute start-3 top-3 z-30 border-0 bg-transparent ${collapsed ? "" : "lg:hidden"}`}
          >
            <PanelRight className="size-4" strokeWidth={1.75} />
          </button>
          {children}
        </main>
      </div>
    </WorkspaceContext.Provider>
  );
}

/* ---------- Sidebar: nav on top, task history grouped by day, account at the bottom ---------- */

const navItem =
  "flex h-9 w-full items-center gap-2.5 rounded-xl px-2.5 text-sm text-fg-2 transition-colors duration-150 hover:bg-fg/[0.06] hover:text-fg aria-[current=page]:bg-fg/[0.09] aria-[current=page]:text-fg";

function Sidebar({ onHide }: { onHide: () => void }) {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-1 px-3">
        <Link href="/dashboard" className="group me-auto flex items-center gap-2 rounded-lg px-1 font-semibold">
          <LogoBox size={24} />
          <span className="font-bold">{tc("brand")}</span>
        </Link>
        <Notifications />
        <button onClick={onHide} aria-label={t("hideSidebar")} className={`${button.icon} border-0 bg-transparent`}>
          <PanelRight className="size-4 max-lg:hidden" strokeWidth={1.75} />
          <X className="size-4 lg:hidden" />
        </button>
      </div>

      <nav aria-label={t("mainNav")} className="space-y-0.5 px-2">
        <Link href="/dashboard" aria-current={pathname === "/dashboard" ? "page" : undefined}
          className="mb-2 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-medium text-white shadow-[0_8px_20px_-10px_var(--accent)] transition-[transform,background-color] duration-150 ease-out hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97]"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          {t("newTask")}
        </Link>
        <label className={`${navItem} focus-within:bg-card focus-within:text-fg`}>
          <Search className="size-4 shrink-0" strokeWidth={1.75} />
          <span className="sr-only">{t("search")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="min-w-0 flex-1 bg-transparent placeholder:text-fg-2 focus:outline-none"
          />
        </label>
        <Link href="/settings" aria-current={pathname === "/settings" ? "page" : undefined} className={navItem}>
          <Settings className="size-4" strokeWidth={1.75} />
          {t("settings")}
        </Link>
      </nav>

      <History query={query} pathname={pathname} />
      <Account />
    </>
  );
}

const dayKey = (ts: number) => new Date(ts).toDateString();
const dayFormat = new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" });

function History({ query, pathname }: { query: string; pathname: string }) {
  const t = useTranslations("shell");
  const { runs, projectId, project } = useWorkspace();

  const q = query.trim().toLowerCase();
  const scoped = runs?.filter((r) => !projectId || r.projectId === projectId);
  const visible = scoped?.filter((r) => !q || r.goal.toLowerCase().includes(q) || r.url.toLowerCase().includes(q));

  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - 86_400_000);
  const groups = new Map<string, RunRow[]>();
  for (const r of visible ?? []) {
    const k = dayKey(r.createdAt);
    const label = k === today ? t("today") : k === yesterday ? t("yesterday") : dayFormat.format(r.createdAt);
    groups.set(label, [...(groups.get(label) ?? []), r]);
  }

  return (
    <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
      {project && (
        <div className="mx-1 mb-2 flex items-center gap-2 rounded-xl border border-line bg-fg/[0.04] px-2.5 py-2 text-xs text-fg-2">
          <ProjectAvatar name={project.name} small />
          <span dir="auto" className="min-w-0 flex-1 truncate">{project.name}</span>
          <ClearFilter />
        </div>
      )}
      {visible === undefined ? (
        <div className="space-y-1.5 px-1 pt-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`${skeleton} h-7`} />
          ))}
        </div>
      ) : scoped?.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <PixelGrid cols={9} rows={5} cell={8} gap={4} density={0.12} twinkle={0.1} className="mb-4 w-24" />
          <p className="text-sm text-fg-2">{t("noTasks")}</p>
          <p className="mt-1 text-xs text-pretty text-fg-3">{t("noTasksBody")}</p>
        </div>
      ) : groups.size === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-fg-3">{t("noMatch")}</p>
      ) : (
        [...groups].map(([label, rows], i) => (
          <section key={label} className="mb-4">
            <h3 className="flex h-7 items-center justify-between px-2.5 text-xs text-fg-3">
              {label}
              {i === 0 && <ProjectFilter />}
            </h3>
            <ul className="space-y-px">
              {rows.map((r) => (
                <li key={r._id}>
                  <Link
                    href={`/runs/${r._id}`}
                    aria-current={pathname === `/runs/${r._id}` ? "page" : undefined}
                    title={`${r.goal} · ${hostOf(r.url)} · ${timeAgo(r.createdAt)}`}
                    className={`${navItem} h-8`}
                  >
                    <TaskIcon status={r.status} bugs={r.summary?.bugs} />
                    <span className="truncate">{r.goal}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function ClearFilter() {
  const t = useTranslations("shell");
  const { setProjectId } = useWorkspace();
  return (
    <button onClick={() => setProjectId(null)} aria-label={t("clearFilter")} className="rounded p-0.5 text-fg-3 hover:text-fg">
      <X className="size-3.5" />
    </button>
  );
}

function ProjectFilter() {
  const t = useTranslations("shell");
  const { projects, projectId, setProjectId, runs } = useWorkspace();
  const count = (id: Id<"projects">) => runs?.filter((r) => r.projectId === id).length ?? 0;
  const pick = (id: Id<"projects"> | null, close: () => void) => {
    setProjectId(id);
    close();
  };

  return (
    <Popover
      align="end"
      className="w-64"
      trigger={({ toggle, open }) => (
        <button
          onClick={toggle}
          aria-expanded={open}
          aria-label={t("filterProjects")}
          className={`grid size-6 place-items-center rounded-md transition-colors hover:bg-card hover:text-fg ${projectId ? "text-accent" : ""}`}
        >
          <ListFilter className="size-3.5" />
        </button>
      )}
    >
      {(close) => (
        <>
          <p className="px-2.5 pt-1.5 pb-1 text-xs text-fg-3">{t("projects")}</p>
          <button onClick={() => pick(null, close)} aria-current={projectId === null} className={menuItem}>
            <ProjectAvatar small />
            <span className="flex-1">{t("allProjects")}</span>
            {projectId === null && <Check className="size-4 text-accent" />}
          </button>
          <div className="max-h-64 overflow-y-auto">
            {projects?.map((p) => (
              <button key={p._id} onClick={() => pick(p._id, close)} aria-current={projectId === p._id} className={menuItem}>
                <ProjectAvatar name={p.name} small />
                <span dir="auto" className="min-w-0 flex-1 truncate text-start">{p.name}</span>
                <span className="font-mono text-xs text-fg-3">{count(p._id)}</span>
                {projectId === p._id && <Check className="size-4 text-accent" />}
              </button>
            ))}
          </div>
        </>
      )}
    </Popover>
  );
}

export function ProjectAvatar({ name, small = false }: { name?: string; small?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-md bg-accent-soft font-mono text-accent uppercase ${small ? "size-5 text-[10px]" : "size-8 text-sm"}`}
      aria-hidden
    >
      {name ? name.replace(/^www\./, "")[0] : <Layers className={small ? "size-3" : "size-4"} />}
    </span>
  );
}

function Account() {
  const t = useTranslations("shell");
  const viewer = useQuery(api.runs.viewer);
  const { signOut } = useAuthActions();
  return (
    <div className="border-t border-line p-2.5">
      <Popover
        align="up"
        className="w-full"
        trigger={({ toggle, open }) => (
          <button onClick={toggle} aria-expanded={open} aria-label={t("account")} className={`${navItem} h-11`}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-white uppercase">
              {viewer?.email?.[0] ?? "·"}
            </span>
            <span className="min-w-0 flex-1 text-start">
              <span dir="ltr" className="block truncate text-end text-sm text-fg">{viewer?.email.split("@")[0]}</span>
              <span className="block text-[11px] text-fg-3">{t("plan", { plan: viewer?.plan ?? "free" })}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-fg-3" />
          </button>
        )}
      >
        {() => (
          <>
            <p dir="ltr" className="truncate border-b border-line px-2.5 pt-1.5 pb-2 text-end text-xs text-fg-3">{viewer?.email}</p>
            <div className="pt-1">
              <Link href="/settings" className={menuItem}>
                <Settings className="size-4" strokeWidth={1.75} /> {t("settings")}
              </Link>
              <button onClick={() => void signOut()} className={`${menuItem} hover:text-danger`}>
                <LogOut className="size-4" strokeWidth={1.75} /> {t("signOut")}
              </button>
            </div>
          </>
        )}
      </Popover>
    </div>
  );
}

function Notifications() {
  const t = useTranslations("shell");
  const { runs } = useWorkspace();
  const [seen, setSeen] = useState(Number.POSITIVE_INFINITY);
  useEffect(() => {
    try {
      setSeen(Number(localStorage.getItem(SEEN_KEY) ?? 0));
    } catch {
      setSeen(0);
    }
  }, []);

  const finished = (runs ?? []).filter((r) => r.finishedAt && r.status !== "canceled").slice(0, 6);
  const unread = finished.some((r) => r.finishedAt! > seen);
  const markSeen = () => {
    const now = Date.now();
    setSeen(now);
    try {
      localStorage.setItem(SEEN_KEY, String(now));
    } catch {}
  };

  return (
    <Popover
      align="start"
      className="w-80"
      onOpen={markSeen}
      trigger={({ toggle, open }) => (
        <button onClick={toggle} aria-expanded={open} aria-label={t("notifications")} className={`${button.icon} relative border-0 bg-transparent`}>
          <Bell className="size-4" strokeWidth={1.75} />
          {unread && <span className="absolute top-1.5 end-1.5 size-2 rounded-full bg-accent ring-2 ring-canvas" aria-hidden />}
        </button>
      )}
    >
      {(close) => (
        <>
          <p className="px-2.5 pt-1.5 pb-2 text-sm font-medium">{t("notifications")}</p>
          {finished.length === 0 ? (
            <p className="px-2.5 pb-4 text-sm text-pretty text-fg-3">{t("noNotifications")}</p>
          ) : (
            finished.map((r) => (
              <Link key={r._id} href={`/runs/${r._id}`} onClick={close} className={`${menuItem} items-start`}>
                <span className="mt-0.5">
                  <TaskIcon status={r.status} bugs={r.summary?.bugs} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-fg">{r.goal}</span>
                  <span className="mt-0.5 block text-xs text-fg-3">
                    {r.status === "failed" ? t("notifFailed") : t("notifDone", { count: r.summary?.bugs ?? 0 })} · {timeAgo(r.finishedAt!)}
                  </span>
                </span>
              </Link>
            ))
          )}
        </>
      )}
    </Popover>
  );
}
