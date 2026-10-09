"use client";

import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Bell, ChevronsUpDown, LogOut, PanelRight, Plus, Search, Settings, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hostOf, planKey, timeAgo } from "@/lib/format";
import { LogoBox } from "./brand/LogoBox";
import { menuItem, Popover } from "./overlay";
import { EmptyState } from "./EmptyState";
import { QuietBellIllustration, SearchEmptyIllustration, SitesIllustration } from "./illustrations";
import { TaskIcon } from "./StatusBadge";
import { button, skeleton } from "./ui";

const useRuns = () => useQuery(api.runs.listMine);
export type ProjectRow = NonNullable<ReturnType<typeof useProjects>>[number];
const useProjects = () => useQuery(api.runs.projectList);

type Workspace = {
  runs: ReturnType<typeof useRuns>;
  /** Most recently active first, with run counts and the latest run. */
  projects: ProjectRow[] | undefined;
};

const WorkspaceContext = createContext<Workspace | null>(null);
export const useWorkspace = () => useContext(WorkspaceContext)!;

const SEEN_KEY = "qagent.notifSeen";

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations("shell");
  const runs = useRuns();
  const projects = useProjects();
  const pathname = usePathname();
  /** Mobile: drawer open. Desktop: sidebar collapsed. */
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setDrawer(false), [pathname]);

  const value = useMemo(() => ({ runs, projects }), [runs, projects]);

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
        <label className={`${navItem} focus-within:bg-fg/[0.06] focus-within:text-fg`}>
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

      <ProjectsNav query={query} pathname={pathname} />
      <Account />
    </>
  );
}

/** The sidebar's main list: one entry per site. A run page highlights the project it belongs to. */
function ProjectsNav({ query, pathname }: { query: string; pathname: string }) {
  const t = useTranslations("shell");
  const { projects, runs } = useWorkspace();
  const runId = pathname.startsWith("/runs/") ? pathname.slice(6) : null;
  const currentId = runId ? runs?.find((r) => r._id === runId)?.projectId : pathname.startsWith("/projects/") ? pathname.slice(10) : null;
  const q = query.trim().toLowerCase();
  const visible = projects?.filter((p) => !q || p.name.toLowerCase().includes(q) || p.baseUrl.toLowerCase().includes(q));

  return (
    <div className="mt-5 min-h-0 flex-1 overflow-y-auto px-2 pb-3">
      <h3 className="flex h-7 items-center px-2.5 text-xs text-fg-3">{t("projects")}</h3>
      {visible === undefined ? (
        <div className="space-y-1.5 px-1 pt-1">
          {[0, 1, 2, 3].map((i) => <div key={i} className={`${skeleton} h-11`} />)}
        </div>
      ) : projects?.length === 0 ? (
        <EmptyState art={<SitesIllustration className="w-36" />} title={t("noProjects")} body={t("noProjectsBody")} compact className="mx-1 mt-1 rounded-xl border border-dashed border-line-strong" />
      ) : visible.length === 0 ? (
        <EmptyState art={<SearchEmptyIllustration className="w-28" />} title={t("noMatch")} body={t("noMatchBody")} compact />
      ) : (
        <ul className="space-y-0.5">
          {visible.map((p) => (
            <li key={p._id}>
              <Link href={`/projects/${p._id}`} aria-current={currentId === p._id ? "page" : undefined} className={`${navItem} h-11`}>
                <ProjectAvatar name={p.name} url={p.baseUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate"><bdi>{p.name}</bdi></span>
                  {p.name !== hostOf(p.baseUrl) && <span className="font-url block truncate text-[11px] text-fg-3"><bdi>{hostOf(p.baseUrl)}</bdi></span>}
                </span>
                {p.lastRun && <TaskIcon status={p.lastRun.status} bugs={p.lastRun.summary?.bugs} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Warm-to-cool palette that sits well next to the brand orange; one is picked per site, so it never changes.
const AVATAR_TONES = [
  "from-[#f26b1d] to-[#f5a524]",
  "from-[#e5484d] to-[#f76b8a]",
  "from-[#7c66dc] to-[#a78bfa]",
  "from-[#0090ff] to-[#5eb1ef]",
  "from-[#12a594] to-[#4cc38a]",
  "from-[#3e4c59] to-[#7b8794]",
];
const SIZES = { sm: "size-5 rounded-md text-[10px]", md: "size-8 rounded-lg text-sm", lg: "size-14 rounded-xl text-2xl" };
const ICON_PAD = { sm: "p-0.5", md: "p-1.5", lg: "p-3" };

/**
 * A site's identity: its own favicon, loaded straight from the site, over a colored monogram that shows
 * while it loads and stays when the site has none (or blocks it).
 */
export function ProjectAvatar({ name, url, size = "md" }: { name: string; url: string; size?: keyof typeof SIZES }) {
  const [icon, setIcon] = useState<"loading" | "ok" | "none">("loading");
  const host = hostOf(url).replace(/^www\./, "");
  const tone = AVATAR_TONES[[...host].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % AVATAR_TONES.length];
  const letter = (name.replace(/^www\./, "")[0] ?? "?").toUpperCase();

  return (
    <span aria-hidden className={`relative grid shrink-0 place-items-center overflow-hidden font-bold text-white ${SIZES[size]} ${icon === "ok" ? "bg-white ring-1 ring-line" : `bg-gradient-to-br ${tone}`}`}>
      {icon !== "ok" && letter}
      {icon !== "none" && (
        // eslint-disable-next-line @next/next/no-img-element -- remote favicon of an arbitrary user site; next/image can't allowlist it
        <img
          src={new URL("/favicon.ico", url).href}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={(e) => setIcon(e.currentTarget.naturalWidth > 1 ? "ok" : "none")}
          onError={() => setIcon("none")}
          className={`absolute inset-0 size-full object-contain ${ICON_PAD[size]} ${icon === "ok" ? "" : "opacity-0"}`}
        />
      )}
    </span>
  );
}

function Account() {
  const t = useTranslations("shell");
  const tc = useTranslations("common");
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
              <span className="block text-[11px] text-fg-3">{t("plan", { plan: tc(planKey(viewer?.plan)) })}</span>
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
            <EmptyState art={<QuietBellIllustration className="w-28" />} title={t("noNotifications")} body={t("noNotificationsBody")} compact />
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
