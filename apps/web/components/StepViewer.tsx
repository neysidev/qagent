"use client";

import { useAction } from "convex/react";
import { useTranslations } from "next-intl";
import {
  ArrowDownUp, Check, CornerDownLeft, Globe, Hourglass, Keyboard, ListChecks, MousePointerClick, SquareCheck, X, type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { api } from "@convex/_generated/api";
import { actionValue, type Scenario, type Step } from "@/lib/format";
import { NoStepsIllustration } from "./illustrations";
import { button } from "./ui";
import { ZoomImage } from "./ZoomImage";

/** The selected step on a stage (screenshot + moving cursor), its details, and a scrubbable step list. */
export function StepViewer({ steps, scenarios, live, runId }: { steps: Step[]; scenarios: Scenario[]; live: boolean; runId?: string }) {
  const t = useTranslations("run");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIndex = Math.max(
    0,
    selectedId ? steps.findIndex((s) => s._id === selectedId) : steps.length - 1,
  );
  const step = steps[selectedIndex];
  const following = live && selectedId === null;
  const scenarioTitle = (id: string) => scenarios.find((s) => s._id === id)?.title ?? "";

  const activeRow = useRef<HTMLButtonElement>(null);
  // Only when the person picks a step; while following live, the timeline scrolls itself (and never the page).
  useEffect(() => {
    if (selectedId) activeRow.current?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (!step) {
    return (
      <div className="flex aspect-[16/10] flex-col items-center justify-center rounded-xl bg-surface px-6 text-center">
        <NoStepsIllustration className="w-56 max-w-full" />
        <p className="mt-4 text-sm text-fg-2">{live ? t("noStepsLive") : t("noSteps")}</p>
      </div>
    );
  }

  const label = `${t(`action.${step.action.type}` as "action.click")}${actionValue(step) ? `: ${actionValue(step)}` : ""}`;

  // Screen and steps side by side once there is room (container query, so it adapts to wherever it is placed);
  // the screen is capped to the viewport height, so the whole player fits on one screen without scrolling.
  return (
    <div className="@container">
      <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-3">
          {following && runId ? <LiveStage runId={runId} fallback={<Stage steps={steps} step={step} label={label} />} /> : <Stage steps={steps} step={step} label={label} />}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-fg-3">
                {t("step", { n: selectedIndex + 1 })} · {scenarioTitle(step.scenarioId)}
              </p>
              <p className="mt-1 text-sm text-pretty text-fg">{step.thought}</p>
              {step.error && <p className="mt-1 text-sm text-danger" dir="ltr">{step.error}</p>}
            </div>
            {live && !following && (
              <button onClick={() => setSelectedId(null)} className={button.secondary}>
                <span className="size-2 animate-pulse rounded-full bg-accent" aria-hidden />
                {t("followLive")}
              </button>
            )}
          </div>
        </div>
        <div className="relative min-h-72 @3xl:min-h-0">
          <div className="flex h-full flex-col @3xl:absolute @3xl:inset-0">
            <StepTimeline steps={steps} selectedIndex={selectedIndex} live={live} onSelect={setSelectedId} activeRow={activeRow} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Decoded screenshots by URL, shared across viewers so revisiting a step never re-downloads or flashes.
// ponytail: unbounded per page session; fine for a few hundred steps, add an LRU if runs grow far past that.
const decoded = new Map<string, Promise<void>>();
function preload(url: string | null | undefined): Promise<void> {
  if (!url) return Promise.resolve();
  let p = decoded.get(url);
  if (!p) {
    const img = new Image();
    img.src = url;
    p = img.decode().catch(() => {}); // a broken image still resolves, so the stage never stalls on it
    decoded.set(url, p);
  }
  return p;
}

/** The worker's real browser as an MJPEG <img>; shows `fallback` (the step stage) until frames arrive or if the stream is unavailable. */
function LiveStage({ runId, fallback }: { runId: string; fallback: React.ReactNode }) {
  const access = useAction(api.runs.liveAccess);
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    access({ runId: runId as never }).then((u) => alive && setSrc(u)).catch(() => {});
    return () => { alive = false; };
  }, [access, runId]);
  return (
    <>
      {!ready && fallback}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onLoad={() => setReady(true)}
          onError={() => { setSrc(null); setReady(false); }}
          className={ready ? "aspect-[16/10] w-full rounded-xl border border-line object-contain bg-surface" : "hidden"}
        />
      )}
    </>
  );
}

const CLICKY = new Set(["click", "select", "check"]);
type Point = { x: number; y: number };

/** Center of the latest target at or before `index`, as 0..1 of the viewport; center of the page if none. */
function cursorAt(steps: Step[], index: number): Point {
  for (let i = index; i >= 0; i--) {
    const t = steps[i].target;
    if (t) return { x: (t.x + t.w / 2) / steps[i].viewport.w, y: (t.y + t.h / 2) / steps[i].viewport.h };
  }
  return { x: 0.5, y: 0.5 };
}

/**
 * Screenshot + cursor, sequenced like a real session: the next screenshot is decoded off-screen, crossfades in,
 * then the cursor glides along a soft arc to the target and clicks. Moves are interruptible (they start from
 * wherever the cursor is), run as compositor transforms via WAAPI, and snap under reduced motion.
 */
function Stage({ steps, step, label }: { steps: Step[]; step: Step; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const cursorEl = useRef<HTMLDivElement>(null);
  const pos = useRef<Point>({ x: 0.5, y: 0.5 }); // last settled position, 0..1
  const [shown, setShown] = useState(step);
  const [prev, setPrev] = useState<Step | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [arrived, setArrived] = useState<{ id: string; at: Point } | null>(null);
  const shownRef = useRef(shown);

  // Keep the neighbours decoded so scrubbing back and forth is instant.
  const index = steps.findIndex((s) => s._id === step._id);
  useEffect(() => {
    for (const i of [index + 1, index + 2, index - 1]) preload(steps[i]?.screenshotUrl);
  }, [index, steps]);

  // Swap screenshots only once the next one is decoded: no blank frame, no half-painted image.
  useEffect(() => {
    if (step._id === shownRef.current._id) return;
    let alive = true;
    void preload(step.screenshotUrl).then(() => {
      if (!alive) return;
      setPrev(shownRef.current);
      shownRef.current = step;
      setShown(step);
    });
    return () => {
      alive = false;
    };
  }, [step]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shownIndex = steps.findIndex((s) => s._id === shown._id);
  const target = cursorAt(steps, shownIndex < 0 ? index : shownIndex);

  // Glide to the shown step's target. Depends on the target and box size only, so a resize re-places instantly.
  const moveKey = `${shown._id}:${target.x}:${target.y}`;
  const lastMove = useRef("");
  useEffect(() => {
    const el = cursorEl.current;
    if (!el || !size.w) return;
    const px = (p: Point) => `translate(${p.x * size.w}px, ${p.y * size.h}px)`;
    const isNewMove = lastMove.current !== moveKey;
    lastMove.current = moveKey;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Start from where the cursor really is right now, even mid-flight.
    const running = el.getAnimations()[0];
    let from = pos.current;
    if (running) {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      from = { x: m.m41 / size.w, y: m.m42 / size.h };
      running.cancel();
    }
    const done = () => {
      el.style.transform = px(target);
      pos.current = target;
      if (isNewMove) setArrived({ id: shown._id, at: target });
    };
    if (!isNewMove || reduce) return done();

    const dx = (target.x - from.x) * size.w;
    const dy = (target.y - from.y) * size.h;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return done();
    // A hand doesn't travel in a ruler-straight line: bow the path a little to one side (quadratic Bézier).
    const bow = Math.min(dist * 0.18, 60);
    const ctrl = { x: from.x * size.w + dx / 2 - (dy / dist) * bow, y: from.y * size.h + dy / 2 + (dx / dist) * bow };
    const frames = Array.from({ length: 21 }, (_, i) => {
      const t = i / 20;
      const x = (1 - t) ** 2 * from.x * size.w + 2 * (1 - t) * t * ctrl.x + t ** 2 * target.x * size.w;
      const y = (1 - t) ** 2 * from.y * size.h + 2 * (1 - t) * t * ctrl.y + t ** 2 * target.y * size.h;
      return { transform: `translate(${x}px, ${y}px)` };
    });
    const anim = el.animate(frames, {
      duration: Math.min(900, Math.max(360, 260 + dist * 0.9)),
      easing: "cubic-bezier(0.65, 0, 0.25, 1)",
      fill: "forwards",
    });
    anim.onfinish = () => {
      anim.commitStyles?.();
      anim.cancel();
      done();
    };
  }, [moveKey, size.w, size.h]); // eslint-disable-line react-hooks/exhaustive-deps

  const landed = arrived?.id === shown._id;
  const t = shown.target;

  return (
    <div
      ref={box}
      dir="ltr"
      className="relative mx-auto w-full overflow-hidden rounded-xl border border-line bg-surface"
      style={{ aspectRatio: `${shown.viewport.w} / ${shown.viewport.h}`, maxWidth: `calc(58dvh * ${shown.viewport.w} / ${shown.viewport.h})` }}
    >
      {prev?.screenshotUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={prev.screenshotUrl} alt="" aria-hidden className="absolute inset-0 size-full object-contain" />
      )}
      {shown.screenshotUrl && (
        <ZoomImage imgKey={shown._id} src={shown.screenshotUrl} alt={shown.thought}
          className="stage-in absolute inset-0 size-full object-contain" />
      )}

      {t && landed && (
        <div
          key={`hl-${shown._id}`}
          className="target-in pointer-events-none absolute rounded-md border-2 border-accent bg-accent/10"
          style={{
            left: `${(t.x / shown.viewport.w) * 100}%`,
            top: `${(t.y / shown.viewport.h) * 100}%`,
            width: `${(t.w / shown.viewport.w) * 100}%`,
            height: `${(t.h / shown.viewport.h) * 100}%`,
          }}
        />
      )}
      {landed && CLICKY.has(shown.action.type) && (
        <span
          key={`rp-${shown._id}`}
          aria-hidden
          className="click-ripple pointer-events-none absolute size-10 rounded-full border-2 border-accent"
          style={{ left: `calc(${arrived.at.x * 100}% - 20px)`, top: `calc(${arrived.at.y * 100}% - 20px)` }}
        />
      )}

      <div ref={cursorEl} className="pointer-events-none absolute top-0 left-0 will-change-transform">
        <svg key={landed ? `press-${shown._id}` : "idle"} viewBox="0 0 24 24"
          className={`absolute -top-0.5 -left-0.5 size-6 drop-shadow-md ${landed && CLICKY.has(shown.action.type) ? "cursor-press" : ""}`} aria-hidden>
          <path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#111" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span
          key={label}
          className={`label-in absolute top-6 rounded-full bg-card px-2.5 py-1 text-xs whitespace-nowrap text-fg shadow-lg ring-1 ring-line-strong ${target.x > 0.65 ? "right-0" : "left-4"}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

const ACTION_ICONS: Record<string, LucideIcon> = {
  click: MousePointerClick,
  fill: Keyboard,
  select: ListChecks,
  check: SquareCheck,
  press: CornerDownLeft,
  navigate: Globe,
  scroll: ArrowDownUp,
  wait: Hourglass,
  assert: Check,
};

/**
 * Steps as a vertical timeline: an icon per action on one rail. While a run is live, each new step grows into
 * place and the newest one pulses; steps already present on mount render still, so reopening a long run is calm.
 */
function StepTimeline({ steps, selectedIndex, live, onSelect, activeRow }: {
  steps: Step[];
  selectedIndex: number;
  live: boolean;
  onSelect: (id: string) => void;
  activeRow: RefObject<HTMLButtonElement | null>;
}) {
  const t = useTranslations("run");
  const initial = useRef<Set<string> | null>(null);
  initial.current ??= new Set(steps.map((s) => s._id));
  const list = useRef<HTMLOListElement>(null);

  // Keep the newest step in view as it arrives, without scrolling the page itself.
  const last = steps.at(-1)?._id;
  useEffect(() => {
    const el = list.current;
    if (live && el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [last, live]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-fg-3">
        {t("steps")}
        <span className="rounded-full bg-fg/[0.06] px-1.5 py-0.5 text-[10px] text-fg-2">{steps.length.toLocaleString("fa-IR")}</span>
      </h3>
      <ol ref={list} className="relative max-h-80 min-h-0 flex-1 overflow-y-auto rounded-xl border border-line bg-surface p-2 @3xl:max-h-none">
        {steps.map((s, i) => {
          const Icon = ACTION_ICONS[s.action.type] ?? MousePointerClick;
          const fresh = !initial.current!.has(s._id);
          const newest = live && i === steps.length - 1;
          const selected = i === selectedIndex;
          const value = actionValue(s);
          return (
            <li key={s._id} className={fresh ? "step-grow" : undefined}>
              <div className="min-h-0 overflow-hidden">
                <button
                  ref={selected ? activeRow : undefined}
                  onClick={() => onSelect(s._id)}
                  aria-current={selected}
                  className={`group relative flex w-full items-start gap-3 rounded-lg px-2 py-2 text-start transition-colors duration-150 hover:bg-card aria-[current=true]:bg-card aria-[current=true]:shadow-[0_1px_2px_rgb(0_0_0/0.05)] ${fresh ? "step-in" : ""}`}
                >
                  {/* rail: connects this node to the next one */}
                  {i < steps.length - 1 && <span aria-hidden className="absolute top-9 bottom-[-10px] start-[22px] w-px bg-line-strong" />}
                  <span className={`relative grid size-7 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
                    !s.ok ? "bg-danger-soft text-danger" : newest ? "bg-accent text-white" : selected ? "bg-accent-soft text-accent" : "bg-card text-fg-2 ring-1 ring-line-strong"
                  }`}>
                    {newest && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-accent/40 motion-reduce:animate-none" />}
                    <Icon className="relative size-3.5" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-fg">{t(`action.${s.action.type}` as "action.click")}</span>
                      {value && <span dir="ltr" className="font-url truncate rounded bg-fg/[0.05] px-1.5 text-xs text-fg-2">{value}</span>}
                      <span className="ms-auto shrink-0 text-[11px] text-fg-3">{(i + 1).toLocaleString("fa-IR")}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-fg-3">{s.thought}</span>
                  </span>
                  <span className="mt-1.5 shrink-0" aria-hidden>
                    {s.ok ? <Check className="size-3.5 text-success" strokeWidth={2.5} /> : <X className="size-3.5 text-danger" strokeWidth={2.5} />}
                  </span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
