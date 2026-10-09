"use client";

import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowUp, Check, ChevronDown, Globe, KeyRound, LayoutTemplate, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { errorKey, hostOf, nf } from "@/lib/format";
import { ProjectAvatar, useWorkspace } from "./AppShell";
import { menuItem, Popover } from "./overlay";
import { button, input, label } from "./ui";

export const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_SHOP_URL ?? "";
export const TEMPLATES = ["signup", "login", "cart", "contact"] as const;
export type Template = (typeof TEMPLATES)[number];

export type Draft = { url: string; goal: string; template: Template | null };

const withScheme = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`);

/** The agent request box: pick a site, describe the job, send. */
export function Composer({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const t = useTranslations("composer");
  const te = useTranslations("errors");
  const router = useRouter();
  const quota = useQuery(api.runs.quota);
  const createRun = useMutation(api.runs.create);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const outOfQuota = !!quota && quota.used >= quota.limit;
  const ready = !!draft.url.trim() && !!draft.goal.trim() && !pending && !outOfQuota;

  async function send() {
    if (!ready) return;
    setError(null);
    setPending(true);
    try {
      const runId = await createRun({
        url: withScheme(draft.url),
        goal: draft.goal,
        templateKey: draft.template ?? undefined,
        credentials: username && password ? { username, password } : undefined,
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
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <SitePicker url={draft.url} onPick={(url) => setDraft({ ...draft, url })} />
        <Popover
          align="up"
          className="w-80 p-3"
          trigger={({ toggle, open }) => (
            <button type="button" onClick={toggle} aria-expanded={open} className={chip(!!(username && password))}>
              <KeyRound className="size-3.5" strokeWidth={1.75} />
              {t("account")}
              {username && password && <Check className="size-3.5" />}
            </button>
          )}
        >
          {() => (
            <div className="space-y-3">
              <p className="text-xs text-pretty text-fg-3">{t("accountHint")}</p>
              <label className="block space-y-1.5">
                <span className={label}>{t("username")}</span>
                <input dir="ltr" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} className={input} />
              </label>
              <label className="block space-y-1.5">
                <span className={label}>{t("password")}</span>
                <input type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
              </label>
            </div>
          )}
        </Popover>
      </div>

      <div className="rounded-2xl border border-line-strong bg-surface shadow-2xl shadow-black/40 transition-[border-color,box-shadow] duration-150 focus-within:border-accent/40 focus-within:ring-3 focus-within:ring-accent/10">
        <label htmlFor="goal" className="sr-only">{t("goal")}</label>
        <textarea
          id="goal"
          autoFocus
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
          placeholder={draft.url ? t("placeholder", { site: hostOf(withScheme(draft.url)) }) : t("placeholderNoSite")}
          className="block max-h-60 min-h-[60px] w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] leading-relaxed text-fg [field-sizing:content] placeholder:text-fg-3 focus:outline-none"
        />
        <div className="flex items-center gap-1.5 px-2.5 pb-2.5">
          <Popover
            align="up"
            className="w-72"
            trigger={({ toggle, open }) => (
              <button type="button" onClick={toggle} aria-expanded={open} className={`${button.ghost} h-8 px-2.5 text-xs`}>
                <LayoutTemplate className="size-3.5" strokeWidth={1.75} />
                {draft.template ? t(`tpl.${draft.template}`) : t("templates")}
                <ChevronDown className="size-3 text-fg-3" />
              </button>
            )}
          >
            {(close) =>
              TEMPLATES.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-current={draft.template === key}
                  onClick={() => {
                    setDraft({ ...draft, goal: t(`tplGoal.${key}`), template: key });
                    close();
                    document.getElementById("goal")?.focus();
                  }}
                  className={`${menuItem} items-start`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-fg">{t(`tpl.${key}`)}</span>
                    <span className="mt-0.5 block text-xs text-pretty text-fg-3">{t(`tplGoal.${key}`)}</span>
                  </span>
                  {draft.template === key && <Check className="mt-0.5 size-4 text-accent" />}
                </button>
              ))
            }
          </Popover>
          {quota && (
            <span className={`ms-auto font-mono text-xs ${outOfQuota ? "text-danger" : "text-fg-3"}`} title={t("quota")}>
              {nf.format(quota.used)}/{nf.format(quota.limit)}
            </span>
          )}
          <button
            disabled={!ready}
            aria-label={t("send")}
            className={`grid size-8 place-items-center rounded-lg bg-accent text-on-accent transition-[transform,opacity,background-color] duration-150 hover:bg-accent-hover active:scale-[0.94] disabled:opacity-30 ${quota ? "" : "ms-auto"}`}
          >
            {pending ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent" aria-hidden />
            ) : (
              <ArrowUp className="size-4" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>

      <p role={error || outOfQuota ? "alert" : undefined} className={`mt-2 px-1 text-center text-xs ${error || outOfQuota ? "text-danger" : "text-fg-3"}`}>
        {error ?? (outOfQuota ? te("DAILY_LIMIT") : !draft.url ? t("hintSite") : t("hint"))}
      </p>
    </form>
  );
}

const chip = (on: boolean) =>
  `inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition-[transform,background-color,border-color,color] duration-150 active:scale-[0.97] ${
    on ? "border-line-strong bg-card text-fg hover:bg-card-hover" : "border-line bg-card/60 text-fg-2 hover:border-line-strong hover:text-fg"
  }`;

/** Site chip: the first decision for every task. Recent projects, the demo shop, or a typed address. */
function SitePicker({ url, onPick }: { url: string; onPick: (url: string) => void }) {
  const t = useTranslations("composer");
  const { projects, runs } = useWorkspace();
  const [typed, setTyped] = useState("");
  const lastUsed = (id: string) => runs?.find((r) => r.projectId === id)?.createdAt ?? 0;
  const recent = [...(projects ?? [])].sort((a, b) => lastUsed(b._id) - lastUsed(a._id)).slice(0, 6);
  const host = url ? hostOf(withScheme(url)) : "";

  const submitTyped = (close: () => void) => {
    if (!typed.trim()) return;
    onPick(typed.trim());
    setTyped("");
    close();
  };

  return (
    <Popover
      align="up"
      className="w-80"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={
            url
              ? chip(true)
              : "inline-flex h-8 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent-soft px-2.5 text-sm text-accent transition-[transform,background-color] duration-150 hover:bg-accent/20 active:scale-[0.97]"
          }
        >
          {url ? <ProjectAvatar name={host} small /> : <Globe className="size-3.5" strokeWidth={1.75} />}
          <span dir={url ? "ltr" : undefined} className="max-w-56 truncate">{url ? host : t("chooseSite")}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex gap-1.5 p-1.5">
            <label className="relative flex-1">
              <span className="sr-only">{t("siteUrl")}</span>
              <Globe className="pointer-events-none absolute end-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-3" strokeWidth={1.75} />
              <input
                autoFocus
                inputMode="url"
                dir="ltr"
                placeholder="https://example.com"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    submitTyped(close);
                  }
                }}
                className={`${input} pe-8`}
              />
            </label>
            <button type="button" disabled={!typed.trim()} onClick={() => submitTyped(close)} className={`${button.primary} h-9 px-3 text-xs`}>
              {t("use")}
            </button>
          </div>
          {(recent.length > 0 || DEMO_URL) && <p className="px-2.5 pt-2 pb-1 text-xs text-fg-3">{t("recentSites")}</p>}
          {recent.map((p) => (
            <button
              key={p._id}
              type="button"
              aria-current={host === hostOf(p.baseUrl)}
              onClick={() => {
                onPick(p.baseUrl);
                close();
              }}
              className={menuItem}
            >
              <ProjectAvatar name={p.name} small />
              <span className="min-w-0 flex-1">
                <span dir="auto" className="block truncate text-start">{p.name}</span>
                {p.name !== hostOf(p.baseUrl) && <span dir="ltr" className="block truncate text-end text-xs text-fg-3">{hostOf(p.baseUrl)}</span>}
              </span>
              {host === hostOf(p.baseUrl) && <Check className="size-4 text-accent" />}
            </button>
          ))}
          {DEMO_URL && (
            <button
              type="button"
              onClick={() => {
                onPick(DEMO_URL);
                close();
              }}
              className={menuItem}
            >
              <span className="grid size-5 place-items-center rounded-md bg-card-hover text-fg-2">
                <Play className="size-3" />
              </span>
              <span className="flex-1">{t("demoShop")}</span>
            </button>
          )}
        </>
      )}
    </Popover>
  );
}
