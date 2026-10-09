/** App design primitives. Same tokens and shapes as the landing page: pill buttons, soft rounded cards. */
const base =
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium whitespace-nowrap transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const button = {
  primary: `${base} h-9 px-4 bg-accent text-on-accent shadow-[0_8px_20px_-10px_var(--accent)] hover:bg-accent-hover`,
  secondary: `${base} h-9 px-4 border border-line-strong bg-card text-fg hover:bg-card-hover`,
  ghost: `${base} h-9 px-3 text-fg-2 hover:bg-card hover:text-fg`,
  danger: `${base} h-9 px-4 border border-danger/30 text-danger hover:bg-danger-soft`,
  icon: `${base} size-8 shrink-0 border border-line-strong bg-card text-fg-2 hover:border-line-strong hover:bg-card-hover hover:text-fg`,
};

/** Section card: bordered surface. Pair with `cardHeader` for the reference's titled panels. */
export const card = "rounded-xl border border-line bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]";
export const cardHeader = "flex items-center justify-between gap-3 border-b border-line px-5 h-14";
export const cardTitle = "flex items-center gap-2 text-sm font-bold text-fg";

const field =
  "w-full rounded-xl border border-line-strong bg-card text-sm text-fg placeholder:text-fg-3 transition-[border-color,box-shadow] duration-150 hover:border-line-strong focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)] focus:outline-none disabled:opacity-40 aria-invalid:border-danger/60";
export const input = `${field} h-10 px-3.5`;
export const textarea = `${field} px-3 py-2.5 leading-relaxed resize-none`;
export const label = "text-xs font-medium text-fg-2";

export const skeleton = "skeleton rounded-xl bg-fg/[0.06]";

/** Small uppercase-feel meta label used above metrics, like the reference's "TOTAL REVENUE". */
export const eyebrow = "text-xs text-fg-3";

/** Segmented control: wrap buttons in `segmented`, each gets `segment` + aria-pressed. */
export const segmented = "inline-flex rounded-full border border-line bg-surface p-1";
export const segment =
  "h-8 rounded-full px-3.5 text-xs font-medium text-fg-3 transition-[color,background-color,box-shadow] duration-200 hover:text-fg aria-pressed:bg-card aria-pressed:text-fg aria-pressed:shadow-[0_1px_3px_rgb(0_0_0/0.08)]";

const tones = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-accent",
  neutral: "bg-card-hover text-fg-2",
};
export type Tone = keyof typeof tones;
export const pill = (tone: Tone) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`;

export const kbd = "rounded border border-line bg-card px-1.5 font-mono text-[10px] text-fg-3";
