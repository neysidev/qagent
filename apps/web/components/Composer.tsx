"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Check, KeyRound, LogIn, Mail, Play, ShoppingCart, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { errorKey, hostOf, nf } from "@/lib/format";
import { useWorkerOnline } from "@/lib/useWorkerOnline";
import { input, label } from "./ui";

export const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_SHOP_URL ?? "";
export const TEMPLATES = ["signup", "login", "cart", "contact"] as const;
export type Template = (typeof TEMPLATES)[number];

export type Draft = { path: string; goal: string; template: Template | null };

/** Per template: icon, tile color, and whether the flow can only be tested signed in. */
const TEMPLATE_META: Record<Template, { icon: typeof Play; tone: string; needsLogin: boolean }> = {
  signup: { icon: UserPlus, tone: "bg-[#7c66dc]/12 text-[#6b55d0]", needsLogin: false },
  login: { icon: LogIn, tone: "bg-[#0090ff]/12 text-[#0077d4]", needsLogin: true },
  cart: { icon: ShoppingCart, tone: "bg-accent-soft text-accent", needsLogin: false },
  contact: { icon: Mail, tone: "bg-success-soft text-success", needsLogin: false },
};

// A free-text goal that talks about signing in probably needs an account; only used to nudge, never to block.
const LOGIN_HINT = /وارد شو|ورود|لاگین|پنل|داشبورد|پروفایل|حساب کاربری|login|sign ?in|dashboard|account/i;

/** Start URL inside the project's site: the path may be typed with or without a leading slash. */
const startUrl = (site: string, path: string) => new URL(path.trim().replace(/^\/*/, "/"), site).href;

/** New test for one project, as three short steps: what to test, where to start, and (when needed) a test account. */
export function Composer({ site, draft, setDraft }: { site: string; draft: Draft; setDraft: (d: Draft) => void }) {
  const t = useTranslations("composer");
  const te = useTranslations("errors");
  const router = useRouter();
  const quota = useQuery(api.runs.quota);
  const workerOnline = useWorkerOnline();
  const createRun = useMutation(api.runs.create);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasAccount = !!username.trim() && !!password;
  const needsLogin = !!draft.template && TEMPLATE_META[draft.template].needsLogin;
  const mayNeedLogin = !needsLogin && LOGIN_HINT.test(draft.goal);
  const showAccount = accountOpen || needsLogin || hasAccount;
  const outOfQuota = !!quota && quota.used >= quota.limit;
  const ready = !!draft.goal.trim() && (!needsLogin || hasAccount) && !pending && !outOfQuota;

  async function send() {
    if (!ready) return;
    setError(null);
    setPending(true);
    try {
      const runId = await createRun({
        url: startUrl(site, draft.path),
        goal: draft.goal,
        templateKey: draft.template ?? undefined,
        credentials: hasAccount ? { username: username.trim(), password } : undefined,
      });
      router.push(`/runs/${runId}`);
    } catch (err) {
      setError(te(errorKey(err)));
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
      className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
    >
      <Step n={1} title={t("step1")} hint={t("step1Hint")} done={!!draft.goal.trim()}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TEMPLATES.map((key) => {
            const { icon: Icon, tone } = TEMPLATE_META[key];
            const on = draft.template === key;
            return (
              <button key={key} type="button" aria-pressed={on}
                onClick={() => setDraft({ ...draft, goal: t(`tplGoal.${key}`), template: key })}
                className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-start transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? "border-accent bg-accent-soft/60 shadow-[0_0_0_3px_var(--accent-soft)]" : "border-line hover:border-line-strong hover:bg-surface"}`}
              >
                <span className={`grid size-8 shrink-0 place-items-center rounded-md ${tone}`}>
                  <Icon className="size-4" strokeWidth={1.9} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{t(`tpl.${key}`)}</span>
                  <span className="block truncate text-[11px] text-fg-3">{t(`tplHint.${key}`)}</span>
                </span>
              </button>
            );
          })}
        </div>
        <label className="block">
          <span className="sr-only">{t("goalLabel")}</span>
          <textarea
            rows={2}
            maxLength={2000}
            value={draft.goal}
            onChange={(e) => setDraft({ ...draft, goal: e.target.value, template: null })}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter breaks the line; never while a Persian IME is composing.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={t("placeholder", { site: hostOf(site) })}
            className="block max-h-60 min-h-[76px] w-full resize-none rounded-lg border border-line-strong bg-card px-3.5 py-3 text-[15px] leading-relaxed text-fg transition-[border-color,box-shadow] duration-150 [field-sizing:content] placeholder:text-fg-3 focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)] focus:outline-none"
          />
        </label>
      </Step>

      <Step n={2} title={t("step2")} hint={t("step2Hint")} tag={t("optional")}>
        <label dir="ltr" className="font-url flex h-10 items-center rounded-lg border border-line-strong bg-card ps-3.5 text-sm transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft)]">
          <span className="sr-only">{t("startPath")}</span>
          <span className="shrink-0 text-fg-3">{hostOf(site)}</span>
          <input value={draft.path} onChange={(e) => setDraft({ ...draft, path: e.target.value })} placeholder="/" spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent px-0.5 text-fg placeholder:text-fg-3 focus:outline-none" />
        </label>
      </Step>

      <Step n={3} title={t("step3")} hint={t("step3Hint")} tag={needsLogin ? t("required") : t("optional")} tagTone={needsLogin ? "warn" : "muted"} done={hasAccount}>
        {needsLogin && !hasAccount && <Notice tone="warn">{t("needsLogin")}</Notice>}
        {mayNeedLogin && !showAccount && <Notice tone="info">{t("mayNeedLogin")}</Notice>}
        {hasAccount && <Notice tone="ok">{t("accountReady")}</Notice>}
        {showAccount ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={label}>{t("username")}</span>
              <input dir="ltr" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} className={`${input} rounded-lg`} />
            </label>
            <label className="block space-y-1.5">
              <span className={label}>{t("password")}</span>
              <input type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} rounded-lg`} />
            </label>
            {!needsLogin && (
              <button type="button" onClick={() => { setAccountOpen(false); setUsername(""); setPassword(""); }}
                className="inline-flex w-fit items-center gap-1 rounded text-xs text-fg-3 transition-colors hover:text-danger focus-visible:outline-2 focus-visible:outline-accent"
              >
                <X className="size-3.5" aria-hidden />{t("removeAccount")}
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => setAccountOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashed border-line-strong px-3.5 text-sm text-fg-2 transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            <KeyRound className="size-4" strokeWidth={1.75} aria-hidden />{t("addAccount")}
          </button>
        )}
      </Step>

      {workerOnline === false && (
        <div className="px-5 py-4">
          <Notice tone="warn">{t("workerOffline")}</Notice>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 bg-surface px-5 py-4">
        <button disabled={!ready}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white shadow-[0_8px_20px_-10px_var(--accent)] transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-accent-hover active:scale-[0.97] disabled:opacity-40"
        >
          {pending ? <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden /> : <Play className="size-4 fill-current" aria-hidden />}
          {t("send")}
        </button>
        {quota && (
          <span className={`text-xs ${outOfQuota ? "text-danger" : "text-fg-3"}`}>
            {t("quota", { used: nf.format(quota.used), limit: nf.format(quota.limit) })}
          </span>
        )}
        <p role={error || outOfQuota ? "alert" : undefined} className={`ms-auto text-xs ${error || outOfQuota ? "text-danger" : "text-fg-3"}`}>
          {error ?? (outOfQuota ? te("DAILY_LIMIT") : t("hint"))}
        </p>
      </div>
    </form>
  );
}

function Step({ n, title, hint, tag, tagTone = "muted", done = false, children }: {
  n: number;
  title: string;
  hint: string;
  tag?: string;
  tagTone?: "muted" | "warn";
  done?: boolean;
  children: ReactNode;
}) {
  return (
    <fieldset className="grid gap-x-4 px-5 py-5 sm:grid-cols-[28px_1fr]">
      <span aria-hidden className={`grid size-7 place-items-center rounded-full text-xs font-bold transition-colors duration-200 max-sm:hidden ${done ? "bg-success text-white" : "bg-accent text-white"}`}>
        {done ? <Check className="size-3.5" strokeWidth={3} /> : n.toLocaleString("fa-IR")}
      </span>
      <div className="min-w-0">
        <legend className="flex items-center gap-2 font-bold">
          {title}
          {tag && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tagTone === "warn" ? "bg-warning-soft text-warning" : "bg-fg/[0.06] text-fg-3"}`}>{tag}</span>}
        </legend>
        <p className="mt-1 mb-3 text-sm leading-[1.8] text-fg-2">{hint}</p>
        <div className="space-y-3">{children}</div>
      </div>
    </fieldset>
  );
}

function Notice({ tone, children }: { tone: "warn" | "info" | "ok"; children: ReactNode }) {
  const cls = { warn: "border-warning/30 bg-warning-soft text-warning", info: "border-[#0090ff]/25 bg-[#0090ff]/8 text-[#0077d4]", ok: "border-success/30 bg-success-soft text-success" }[tone];
  return <p role={tone === "warn" ? "alert" : undefined} className={`rounded-lg border px-3.5 py-2.5 text-sm leading-[1.8] ${cls}`}>{children}</p>;
}
