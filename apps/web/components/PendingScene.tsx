"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const LINE_MS = 3200;

/**
 * Waiting room for a run that has no scenarios yet (queued or planning). A looping scene of the site being
 * read — a scan beam, elements lighting up as they're found, a cursor visiting them and scenario cards being
 * drafted — next to a status line that changes every few seconds, so the wait reads as progress.
 * All motion is CSS (transform/opacity on the compositor) and stops under prefers-reduced-motion.
 */
export function PendingScene({ status, host }: { status: "queued" | "planning"; host: string }) {
  const t = useTranslations("run.pending");
  const lines = t.raw(status === "queued" ? "queuedLines" : "planningLines") as string[];
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), LINE_MS);
    return () => clearInterval(id);
  }, [status, lines.length]);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="relative bg-surface px-6 pt-8 pb-2">
        <div aria-hidden className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_55%_70%_at_50%_45%,var(--accent-soft),transparent)]" />
        <Scene host={host} planning={status === "planning"} />
      </div>
      <p aria-live="polite" className="px-6 pt-6 pb-8 text-center text-[15px] text-fg-2">
        <span key={`${status}-${i}`} className="pending-line inline-block">{lines[i]}</span>
      </p>
    </section>
  );
}

function Scene({ host, planning }: { host: string; planning: boolean }) {
  // Page elements in the mock site; each lights up in turn as if detected.
  const blocks = [
    { x: 24, y: 54, w: 92, h: 10 },
    { x: 24, y: 72, w: 150, h: 6 },
    { x: 24, y: 84, w: 128, h: 6 },
    { x: 24, y: 104, w: 70, h: 20, cta: true },
    { x: 24, y: 138, w: 150, h: 26, field: true },
    { x: 24, y: 172, w: 150, h: 26, field: true },
  ];
  return (
    <svg viewBox="0 0 420 230" direction="ltr" className="relative mx-auto block w-full max-w-[520px]" aria-hidden>
      {/* site under test */}
      <g className="pending-float">
        <rect x="8" y="10" width="260" height="210" rx="12" className="fill-card stroke-line-strong" strokeWidth="1.5" />
        <path d="M8 36 H268" className="stroke-line" strokeWidth="1.5" />
        {[22, 33, 44].map((cx) => <circle key={cx} cx={cx} cy="23" r="3" className="fill-pixel-off" />)}
        <rect x="60" y="16" width="190" height="14" rx="7" className="fill-surface" />
        <circle cx="70" cy="23" r="3" className="fill-success" />
        <text x="80" y="26.5" fontSize="8.5" className="fill-fg-3" style={{ fontFamily: "var(--font-geist), sans-serif" }}>{host}</text>

        {blocks.map((b, n) => (
          <rect key={n} x={b.x} y={b.y} width={b.w} height={b.h} rx={b.field ? 6 : b.cta ? 10 : 3}
            className={`pending-block ${b.cta ? "fill-accent" : b.field ? "fill-card stroke-line-strong" : "fill-pixel-off"}`}
            strokeWidth={b.field ? 1.2 : undefined} style={{ animationDelay: `${n * 0.45}s` }} />
        ))}
        <rect x="196" y="54" width="58" height="70" rx="8" className="pending-block fill-surface" style={{ animationDelay: "1.2s" }} />
        <path d="M202 116 l14 -18 l10 12 l6 -7 l16 13 z" className="fill-pixel-off" />

        {/* detection boxes snapping around found elements */}
        <rect x="20" y="100" width="78" height="28" rx="12" className="pending-detect fill-none stroke-accent" strokeWidth="1.5" strokeDasharray="4 3" />
        <rect x="20" y="134" width="158" height="34" rx="8" className="pending-detect fill-none stroke-accent" strokeWidth="1.5" strokeDasharray="4 3" style={{ animationDelay: "2s" }} />

        {/* scan beam */}
        <g className="pending-scan">
          <rect x="9" y="38" width="258" height="26" fill="url(#pending-beam)" />
          <rect x="9" y="63" width="258" height="1.5" className="fill-accent" opacity="0.7" />
        </g>

        {/* cursor visiting elements */}
        <g className="pending-cursor">
          <path d="M0 0 l0 16 l4.3 -4 l3 7 l2.8 -1.2 l-3 -7 l5.9 -0.4 z" className="fill-fg stroke-card" strokeWidth="1.3" strokeLinejoin="round" />
          <circle r="9" className="pending-click fill-none stroke-accent" strokeWidth="1.5" />
        </g>
      </g>

      {/* scenarios being drafted; dimmed while still queued (animations override inline opacity, so dim a wrapper) */}
      <g opacity={planning ? 1 : 0.35}>
      {[0, 1, 2].map((n) => (
        <g key={n} className="pending-card" style={{ animationDelay: `${0.6 + n * 0.9}s` }}>
          <rect x="288" y={34 + n * 62} width="124" height="50" rx="10" className="fill-card stroke-line-strong" strokeWidth="1.2" />
          <rect x="300" y={46 + n * 62} width="16" height="16" rx="5" className={["fill-success-soft", "fill-warning-soft", "fill-accent-soft"][n]} />
          <path d={`M303.5 ${54 + n * 62} l3 3 l5.5 -6`} fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            className={`pending-check ${["stroke-success", "stroke-warning", "stroke-accent"][n]}`} style={{ animationDelay: `${1.1 + n * 0.9}s` }} />
          <rect x="324" y={47 + n * 62} width={[70, 56, 64][n]} height="5" rx="2.5" className="fill-fg-3" opacity="0.5" />
          <rect x="324" y={57 + n * 62} width={[48, 62, 40][n]} height="4" rx="2" className="fill-pixel-off" />
          <rect x="300" y={70 + n * 62} width="100" height="3" rx="1.5" className="fill-pixel-off" opacity="0.7" />
        </g>
      ))}
      </g>

      <defs>
        <linearGradient id="pending-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.18" />
        </linearGradient>
      </defs>
    </svg>
  );
}
