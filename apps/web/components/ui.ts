const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[transform,background-color,opacity] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

export const button = {
  primary: `${base} bg-zinc-900 px-4 py-2.5 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200`,
  accent: `${base} bg-blue-600 px-4 py-2.5 text-white hover:bg-blue-500`,
  secondary: `${base} border border-zinc-300 bg-white px-4 py-2.5 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800`,
  ghost: `${base} px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`,
  danger: `${base} border border-red-300 px-3 py-2 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950`,
};

export const card = "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

export const input =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base placeholder:text-zinc-400 focus:border-blue-500 focus:outline-2 focus:outline-blue-500/30 dark:border-zinc-700 dark:bg-zinc-950";

export const skeleton = "animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800";
