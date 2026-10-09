/**
 * "The Box": black-box cube with the agent pixel on the lid.
 * Phase 2 states are CSS-only: idle (pixel breathes, lid lifts on parent `.group` hover),
 * bug (red pixel), pass (lid closed, check drawn once an ancestor gets `data-in`).
 * ponytail: loading/open states land with the Motion choreography in phase 3.
 */
export type LogoState = "idle" | "bug" | "pass";

export function LogoBox({ state = "idle", size = 28, className = "" }: { state?: LogoState; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 70 70" width={size} height={size} className={className} aria-hidden fill="none"
      stroke="var(--text-primary)" strokeWidth="2.5" strokeLinejoin="round"
    >
      <path d="M10 22 L10 48 L35 62 L35 36 Z" fill="var(--bg-card)" />
      <path d="M60 22 L60 48 L35 62 L35 36 Z" fill="var(--bg-canvas)" />
      <g className="logo-lid">
        <path d="M35 8 L60 22 L35 36 L10 22 Z" fill="var(--bg-shell)" />
        {state === "pass" ? (
          <path className="logo-check" d="M27 22 L33 27 L44 16" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" />
        ) : (
          <rect x="30" y="17" width="10" height="10" stroke="none"
            fill={state === "bug" ? "var(--danger)" : "var(--accent)"}
            className={state === "idle" ? "logo-pixel" : undefined}
          />
        )}
      </g>
    </svg>
  );
}
