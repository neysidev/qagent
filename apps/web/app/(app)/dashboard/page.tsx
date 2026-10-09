"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/components/AppShell";
import { LogoBox } from "@/components/brand/LogoBox";
import { Composer, DEMO_URL, TEMPLATES, type Draft } from "@/components/Composer";
import { formatUsd, hostOf, nf } from "@/lib/format";

type RunRow = NonNullable<ReturnType<typeof useWorkspace>["runs"]>[number];
const DAY = 86_400_000;
const RANGES = ["all", "30", "7"] as const;
type Range = (typeof RANGES)[number];

export default function Home() {
  const t = useTranslations("home");
  const viewer = useQuery(api.runs.viewer);
  const { runs, project } = useWorkspace();
  const [draft, setDraft] = useState<Draft>({ url: "", goal: "", template: null });

  // Default the site to the filtered project, else the last site the agent tested.
  const defaultUrl = project?.baseUrl ?? (runs?.[0] ? new URL(runs[0].url).origin : "");
  useEffect(() => {
    if (defaultUrl) setDraft((d) => (d.url ? d : { ...d, url: defaultUrl }));
  }, [defaultUrl]);

  const name = viewer?.email.split("@")[0];

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto w-full max-w-[680px] flex-1 px-4 pt-16 pb-8 sm:pt-[12vh]">
        <h1 className="flex items-center gap-3 text-2xl font-medium tracking-tight sm:text-[28px]">
          <LogoBox size={30} />
          {name ? t("greeting", { name }) : t("greetingAnon")}
        </h1>
        <div className="mt-8">
          {runs === undefined ? (
            <div className="h-[300px] animate-pulse rounded-xl bg-surface" />
          ) : runs.length === 0 ? (
            <Starters onPick={(d) => setDraft(d)} />
          ) : (
            <Stats runs={runs} />
          )}
        </div>
      </div>
      <div className="sticky bottom-0 z-20 bg-linear-to-t from-canvas from-70% to-transparent pt-8 pb-3">
        <div className="mx-auto w-full max-w-[840px] px-4">
          <Composer draft={draft} setDraft={setDraft} />
        </div>
      </div>
    </div>
  );
}

/** Empty state: one click fills the composer, the user still reviews and sends. */
function Starters({ onPick }: { onPick: (d: Draft) => void }) {
  const t = useTranslations("home");
  const tc = useTranslations("composer");
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {DEMO_URL && (
        <button
          onClick={() => onPick({ url: DEMO_URL, goal: t("demoGoal"), template: "cart" })}
          className="group flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4 text-start transition-[transform,background-color] duration-150 hover:bg-accent/20 active:scale-[0.99] sm:col-span-2"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-on-accent">
            <Play className="size-4" />
          </span>
          <span>
            <span className="block text-sm font-medium text-fg">{t("demoTitle")}</span>
            <span className="mt-0.5 block text-xs text-pretty text-fg-2">{t("demoBody")}</span>
          </span>
        </button>
      )}
      {TEMPLATES.map((key) => (
        <button
          key={key}
          onClick={() => onPick({ url: "", goal: tc(`tplGoal.${key}`), template: key })}
          className="rounded-xl border border-line bg-surface p-4 text-start transition-[transform,background-color,border-color] duration-150 hover:border-line-strong hover:bg-card active:scale-[0.99]"
        >
          <span className="block text-sm text-fg">{tc(`tpl.${key}`)}</span>
          <span className="mt-1 block text-xs text-pretty text-fg-3">{tc(`tplGoal.${key}`)}</span>
        </button>
      ))}
    </div>
  );
}

const tab = "h-7 rounded-md px-2.5 text-xs text-fg-3 transition-colors hover:text-fg aria-pressed:bg-card-hover aria-pressed:text-fg";

function Stats({ runs }: { runs: RunRow[] }) {
  const t = useTranslations("home");
  const [view, setView] = useState<"overview" | "projects">("overview");
  const [range, setRange] = useState<Range>("all");
  const [now] = useState(() => Date.now());
  const scoped = range === "all" ? runs : runs.filter((r) => r.createdAt >= now - Number(range) * DAY);

  return (
    <section className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-0.5" role="group" aria-label={t("view")}>
          {(["overview", "projects"] as const).map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => setView(v)} className={tab}>
              {t(v)}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5" role="group" aria-label={t("range")}>
          {RANGES.map((r) => (
            <button key={r} aria-pressed={range === r} onClick={() => setRange(r)} className={tab}>
              {t(`range_${r}`)}
            </button>
          ))}
        </div>
      </div>
      {view === "overview" ? <Overview runs={scoped} all={runs} now={now} /> : <Projects runs={scoped} />}
    </section>
  );
}

function Overview({ runs, all, now }: { runs: RunRow[]; all: RunRow[]; now: number }) {
  const t = useTranslations("home");
  const total = runs.reduce((n, r) => n + (r.summary?.total ?? 0), 0);
  const passed = runs.reduce((n, r) => n + (r.summary?.passed ?? 0), 0);
  const bugs = runs.reduce((n, r) => n + (r.summary?.bugs ?? 0), 0);
  const days = new Set(runs.map((r) => new Date(r.createdAt).toDateString())).size;

  const tiles = [
    { label: t("tasks"), value: nf.format(runs.length) },
    { label: t("scenarios"), value: nf.format(total) },
    { label: t("bugs"), value: nf.format(bugs) },
    { label: t("activeDays"), value: nf.format(days) },
    { label: t("passRate"), value: total ? `${nf.format(Math.round((passed / total) * 100))}٪` : "—" },
    { label: t("spend"), value: formatUsd(runs.reduce((n, r) => n + (r.cost?.usd ?? 0), 0)), ltr: true },
  ];

  return (
    <>
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {tiles.map((s) => (
          <div key={s.label} className="rounded-lg bg-card px-2.5 py-2">
            <p className="text-xs text-fg-3">{s.label}</p>
            <p className="mt-0.5 font-mono text-[15px] font-medium text-fg" dir={s.ltr ? "ltr" : undefined}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
      <Heatmap runs={all} now={now} />
      <p className="mt-3 text-xs text-pretty text-fg-3">
        {bugs ? t("insight", { tasks: nf.format(runs.length), bugs: nf.format(bugs) }) : t("insightClean", { tasks: nf.format(runs.length) })}
      </p>
    </>
  );
}

const WEEKS = 26;
const df = new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" });

/** Last 26 weeks of agent activity, oldest at the left. Intensity = tasks that day. */
function Heatmap({ runs, now }: { runs: RunRow[]; now: number }) {
  const t = useTranslations("home");
  const counts = new Map<string, number>();
  for (const r of runs) {
    const k = new Date(r.createdAt).toDateString();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const start = now - (WEEKS * 7 - 1) * DAY;
  const tone = (n: number) => (n === 0 ? "bg-pixel-off" : n === 1 ? "bg-accent/35" : n === 2 ? "bg-accent/65" : "bg-accent");

  return (
    <div
      dir="ltr"
      className="mt-3 grid grid-flow-col grid-rows-7 gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}
      role="img"
      aria-label={t("heatmap")}
    >
      {Array.from({ length: WEEKS * 7 }, (_, i) => {
        const day = start + i * DAY;
        const n = counts.get(new Date(day).toDateString()) ?? 0;
        return <span key={i} title={`${df.format(day)} · ${t("tasksN", { n })}`} className={`aspect-square rounded-[3px] ${tone(n)}`} />;
      })}
    </div>
  );
}

function Projects({ runs }: { runs: RunRow[] }) {
  const t = useTranslations("home");
  const { projects, setProjectId } = useWorkspace();
  const rows = (projects ?? [])
    .map((p) => {
      const own = runs.filter((r) => r.projectId === p._id);
      return { p, tasks: own.length, bugs: own.reduce((n, r) => n + (r.summary?.bugs ?? 0), 0) };
    })
    .filter((r) => r.tasks)
    .sort((a, b) => b.tasks - a.tasks);
  const max = Math.max(1, ...rows.map((r) => r.tasks));

  if (!rows.length) return <p className="py-10 text-center text-sm text-fg-3">{t("noProjectsInRange")}</p>;
  return (
    <ul className="mt-3 space-y-1">
      {rows.map(({ p, tasks, bugs }) => (
        <li key={p._id}>
          <button onClick={() => setProjectId(p._id)} className="w-full rounded-lg bg-card px-3 py-2 text-start transition-colors hover:bg-card-hover">
            <span className="flex items-center justify-between gap-3 text-sm">
              <span dir="auto" className="truncate text-fg">{p.name}</span>
              <span className="shrink-0 font-mono text-xs text-fg-3">
                {t("tasksN", { n: tasks })} · <span className={bugs ? "text-warning" : ""}>{t("bugsN", { n: bugs })}</span>
              </span>
            </span>
            <span className="mt-2 block h-1 overflow-hidden rounded-full bg-pixel-off" dir="ltr">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${(tasks / max) * 100}%` }} />
            </span>
            <span dir="ltr" className="sr-only">{hostOf(p.baseUrl)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
