"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Check, KeyRound, MapPin, Play, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { errorKey, hostOf, nf } from "@/lib/format";
import { useWorkerOnline } from "@/lib/useWorkerOnline";
import { input, label } from "./ui";

export type Draft = { path: string; goal: string };

const LOGIN_HINT = /وارد شو|ورود|لاگین|پنل|داشبورد|پروفایل|حساب کاربری|login|sign ?in|dashboard|account/i;

const startUrl = (site: string, path: string) => new URL(path.trim().replace(/^\/*/, "/"), site).href;

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
  const [pathOpen, setPathOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasAccount = !!username.trim() && !!password;
  const mayNeedLogin = LOGIN_HINT.test(draft.goal);
  const showAccount = accountOpen || hasAccount;
  const showPath = pathOpen || !!draft.path.trim();
  const outOfQuota = !!quota && quota.used >= quota.limit;
  const ready = !!draft.goal.trim() && !pending && !outOfQuota;

  async function send() {
    if (!ready) return;
    setError(null);
    setPending(true);
    try {
      const runId = await createRun({
        url: startUrl(site, draft.path),
        goal: draft.goal,
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
      <div className="space-y-3 px-5 py-5">
        <label htmlFor="goal" className="block">
          <span className="font-bold">{t("step1")}</span>
          <span className="mt-1 block text-sm leading-[1.8] text-fg-2">{t("step1Hint")}</span>
        </label>
        <textarea
          id="goal"
          rows={2}
          maxLength={2000}
          value={draft.goal}
          onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={t("placeholder", { site: hostOf(site) })}
          className="block max-h-60 min-h-[76px] w-full resize-none rounded-lg border border-line-strong bg-card px-3.5 py-3 text-[15px] leading-relaxed text-fg transition-[border-color,box-shadow] duration-150 [field-sizing:content] placeholder:text-fg-3 focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)] focus:outline-none"
        />
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-sm text-fg-3">{t("moreOptions")}</span>
          <Chip on={showPath} done={!!draft.path.trim()} icon={MapPin} label={t("optionPath")} onClick={() => {
            if (showPath) setDraft({ ...draft, path: "" });
            setPathOpen(!showPath);
          }} />
          <Chip on={showAccount} done={hasAccount} icon={KeyRound} label={t("optionAccount")} onClick={() => {
            if (showAccount) { setUsername(""); setPassword(""); }
            setAccountOpen(!showAccount);
          }} />
        </div>
        {mayNeedLogin && !showAccount && <Notice tone="info">{t("mayNeedLogin")}</Notice>}

        <Reveal open={showPath}>
          <p className="mb-2 text-sm text-fg-2">{t("step2Hint")}</p>
          <label dir="ltr" className="font-url flex h-10 items-center rounded-lg border border-line-strong bg-card ps-3.5 text-sm transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_4px_var(--accent-soft)]">
            <span className="sr-only">{t("startPath")}</span>
            <span className="shrink-0 text-fg-3">{hostOf(site)}</span>
            <input value={draft.path} onChange={(e) => setDraft({ ...draft, path: e.target.value })} placeholder="/" spellCheck={false} tabIndex={showPath ? 0 : -1}
              className="h-full min-w-0 flex-1 bg-transparent px-0.5 text-fg placeholder:text-fg-3 focus:outline-none" />
          </label>
        </Reveal>

        <Reveal open={showAccount}>
          <p className="mb-2 text-sm text-fg-2">{t("step3Hint")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className={label}>{t("username")}</span>
              <input dir="ltr" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} tabIndex={showAccount ? 0 : -1} className={`${input} rounded-lg`} />
            </label>
            <label className="block space-y-1.5">
              <span className={label}>{t("password")}</span>
              <input type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} tabIndex={showAccount ? 0 : -1} className={`${input} rounded-lg`} />
            </label>
          </div>
        </Reveal>
      </div>

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

function Chip({ on, done, icon: Icon, label, onClick }: { on: boolean; done: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-[border-color,background-color,color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${on ? "border-accent bg-accent-soft/60 text-accent" : "border-dashed border-line-strong text-fg-2 hover:border-accent hover:text-accent"}`}
    >
      {done ? <Check className="size-4" strokeWidth={2.5} aria-hidden /> : <Icon className="size-4" strokeWidth={1.75} aria-hidden />}
      {label}
    </button>
  );
}

function Reveal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div aria-hidden={!open} inert={!open} className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="min-h-0 overflow-hidden"><div className="p-0.5">{children}</div></div>
    </div>
  );
}

function Notice({ tone, children }: { tone: "warn" | "info" | "ok"; children: ReactNode }) {
  const cls = { warn: "border-warning/30 bg-warning-soft text-warning", info: "border-[#0090ff]/25 bg-[#0090ff]/8 text-[#0077d4]", ok: "border-success/30 bg-success-soft text-success" }[tone];
  return <p role={tone === "warn" ? "alert" : undefined} className={`rounded-lg border px-3.5 py-2.5 text-sm leading-[1.8] ${cls}`}>{children}</p>;
}
