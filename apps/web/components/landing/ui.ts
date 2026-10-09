const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };

export const btn = {
  primary: (s: keyof typeof sizes = "md") => `${base} ${sizes[s]} bg-accent text-on-accent hover:bg-accent-hover`,
  secondary: (s: keyof typeof sizes = "md") =>
    `${base} ${sizes[s]} border border-line bg-card text-fg hover:border-line-strong hover:bg-card-hover`,
  ghost: (s: keyof typeof sizes = "md") => `${base} ${sizes[s]} text-fg-2 hover:bg-card hover:text-fg`,
};
export const container = "mx-auto w-full max-w-[1200px] px-4 sm:px-6";
