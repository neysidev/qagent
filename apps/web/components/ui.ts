/** App design primitives. Same tokens as the landing page (globals.css); dark only. */
const base =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const button = {
  primary: `${base} h-9 px-3.5 bg-accent text-on-accent hover:bg-accent-hover`,
  secondary: `${base} h-9 px-3.5 border border-line bg-card text-fg hover:border-line-strong hover:bg-card-hover`,
  ghost: `${base} h-9 px-3 text-fg-2 hover:bg-card hover:text-fg`,
  danger: `${base} h-9 px-3.5 border border-danger/30 text-danger hover:bg-danger-soft`,
  icon: `${base} size-8 shrink-0 border border-line bg-card text-fg-2 hover:border-line-strong hover:bg-card-hover hover:text-fg`,
};

/** Section card: bordered surface. Pair with `cardHeader` for the reference's titled panels. */
export const card = "rounded-xl border border-line bg-surface";
export const cardHeader = "flex items-center justify-between gap-3 border-b border-line px-4 h-12";
export const cardTitle = "flex items-center gap-2 text-sm font-medium text-fg-2";

const field =
  "w-full rounded-lg border border-line bg-shell text-sm text-fg placeholder:text-fg-3 transition-[border-color,box-shadow] duration-150 hover:border-line-strong focus:border-accent/60 focus:ring-3 focus:ring-accent/15 focus:outline-none disabled:opacity-40 aria-invalid:border-danger/60";
export const input = `${field} h-9 px-3`;
export const textarea = `${field} px-3 py-2.5 leading-relaxed resize-none`;
export const label = "text-xs font-medium text-fg-2";

export const skeleton = "animate-pulse rounded-lg bg-card";

/** Small uppercase-feel meta label used above metrics, like the reference's "TOTAL REVENUE". */
export const eyebrow = "text-xs text-fg-3";

/** Segmented control: wrap buttons in `segmented`, each gets `segment` + aria-pressed. */
export const segmented = "inline-flex rounded-lg border border-line bg-shell p-0.5";
export const segment =
  "h-7 rounded-md px-3 text-xs text-fg-3 transition-colors duration-150 hover:text-fg aria-pressed:bg-card-hover aria-pressed:text-fg";

const tones = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-accent",
  neutral: "bg-card-hover text-fg-2",
};
export type Tone = keyof typeof tones;
export const pill = (tone: Tone) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`;

export const kbd = "rounded border border-line bg-card px-1.5 font-mono text-[10px] text-fg-3";
