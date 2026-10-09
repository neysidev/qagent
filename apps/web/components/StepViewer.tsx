"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { actionValue, type Scenario, type Step } from "@/lib/format";
import { NoStepsIllustration } from "./illustrations";
import { button } from "./ui";

/** Screenshot of the selected step with a virtual cursor gliding between targets, plus a scrubbable timeline. */
export function StepViewer({ steps, scenarios, live }: { steps: Step[]; scenarios: Scenario[]; live: boolean }) {
  const t = useTranslations("run");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIndex = Math.max(
    0,
    selectedId ? steps.findIndex((s) => s._id === selectedId) : steps.length - 1,
  );
  const step = steps[selectedIndex];
  const following = live && selectedId === null;
  const scenarioTitle = (id: string) => scenarios.find((s) => s._id === id)?.title ?? "";

  // Cursor rests on the latest target at or before the shown step.
  const cursorStep = steps
    .slice(0, selectedIndex + 1)
    .reverse()
    .find((s) => s.target);
  const pct = (s: Step | undefined) =>
    s?.target
      ? {
          x: ((s.target.x + s.target.w / 2) / s.viewport.w) * 100,
          y: ((s.target.y + s.target.h / 2) / s.viewport.h) * 100,
        }
      : { x: 50, y: 50 };
  const cursor = pct(cursorStep);

  const activeRow = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeRow.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!step) {
    return (
      <div className="flex aspect-[16/10] flex-col items-center justify-center rounded-xl bg-surface px-6 text-center">
        <NoStepsIllustration className="w-56 max-w-full" />
        <p className="mt-4 text-sm text-fg-2">{live ? t("noStepsLive") : t("noSteps")}</p>
      </div>
    );
  }

  const label = `${t(`action.${step.action.type}` as "action.click")}${actionValue(step) ? `: ${actionValue(step)}` : ""}`;

  return (
    <div className="space-y-3">
      <div
        dir="ltr"
        className="relative overflow-hidden rounded-xl border border-line bg-canvas"
        style={{ aspectRatio: `${step.viewport.w} / ${step.viewport.h}` }}
      >
        {step.screenshotUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={step.screenshotUrl} alt={step.thought} className="absolute inset-0 size-full object-contain" />
        )}
        {step.target && (
          <div
            key={step._id}
            className="animate-rise absolute rounded-md border-2 border-accent bg-accent/10"
            style={{
              left: `${(step.target.x / step.viewport.w) * 100}%`,
              top: `${(step.target.y / step.viewport.h) * 100}%`,
              width: `${(step.target.w / step.viewport.w) * 100}%`,
              height: `${(step.target.h / step.viewport.h) * 100}%`,
            }}
          />
        )}
        {/* Full-size layer so translate(%) maps to screenshot coordinates. */}
        <div
          className="pointer-events-none absolute inset-0 transition-transform duration-[400ms] ease-[var(--ease-in-out-strong)] motion-reduce:transition-none"
          style={{ transform: `translate(${cursor.x}%, ${cursor.y}%)` }}
        >
          <svg viewBox="0 0 24 24" className="absolute -top-0.5 -left-0.5 size-6 drop-shadow-md" aria-hidden>
            <path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#111" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span
            className={`absolute top-6 rounded-full bg-card px-2.5 py-1 text-xs whitespace-nowrap text-fg shadow-lg ring-1 ring-line-strong ${cursor.x > 65 ? "right-0" : "left-4"}`}
          >
            {label}
          </span>
        </div>
      </div>

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

      <div>
        <h3 className="mb-2 text-xs font-medium text-fg-3">{t("steps")}</h3>
        <ol className="max-h-72 space-y-0.5 overflow-y-auto rounded-lg border border-line bg-shell/50 p-1">
          {steps.map((s, i) => (
            <li key={s._id}>
              <button
                ref={i === selectedIndex ? activeRow : undefined}
                onClick={() => setSelectedId(s._id)}
                aria-current={i === selectedIndex}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-start text-sm text-fg-2 transition-colors duration-100 hover:bg-card aria-[current=true]:bg-accent-soft aria-[current=true]:text-fg"
              >
                <span className="w-6 shrink-0 font-mono text-[11px] text-fg-3">{i + 1}</span>
                <span className={`size-1.5 shrink-0 rounded-full ${s.ok ? "bg-success" : "bg-danger"}`} aria-hidden />
                <span className="shrink-0 font-medium">{t(`action.${s.action.type}` as "action.click")}</span>
                <span className="truncate text-fg-3">{s.thought}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
