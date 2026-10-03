"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Header } from "@/components/Header";
import { RequireAuth } from "@/components/RequireAuth";
import { button, card, input } from "@/components/ui";
import { useRouter, type Locale } from "@/i18n/routing";
import { errorKey } from "@/lib/format";

const TEMPLATES = ["signup", "login", "cart", "contact"] as const;
type Template = (typeof TEMPLATES)[number];

function NewTest() {
  const t = useTranslations("newTest");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const createRun = useMutation(api.runs.create);
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const withScheme = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    try {
      const runId = await createRun({
        url: withScheme,
        goal,
        locale,
        templateKey: template ?? undefined,
        credentials: username && password ? { username, password } : undefined,
      });
      router.push(`/runs/${runId}`);
    } catch (err) {
      setError(te(errorKey(err)));
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>
      <form onSubmit={onSubmit} className={`${card} space-y-5 p-6`}>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("url")}</span>
          <input
            required
            inputMode="url"
            autoComplete="url"
            dir="ltr"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={input}
          />
        </label>

        <div className="space-y-1.5">
          <span className="text-sm font-medium">{t("templates")}</span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={template === key}
                onClick={() => {
                  setTemplate(key);
                  setGoal(t(`tplGoal.${key}`));
                }}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm transition-[transform,background-color] duration-150 ease-out active:scale-[0.97] hover:bg-zinc-100 aria-pressed:border-blue-600 aria-pressed:bg-blue-50 aria-pressed:text-blue-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:aria-pressed:bg-blue-950 dark:aria-pressed:text-blue-300"
              >
                {t(`tpl.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("goal")}</span>
          <textarea
            required
            rows={4}
            maxLength={2000}
            placeholder={t("goalPlaceholder")}
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
              setTemplate(null);
            }}
            className={input}
          />
        </label>

        <details className="group rounded-lg border border-zinc-200 dark:border-zinc-800">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">{t("credentials")}</summary>
          <div className="space-y-3 px-4 pb-4">
            <p className="text-xs text-zinc-500">{t("credentialsHint")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm">{t("username")}</span>
                <input dir="ltr" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} className={input} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm">{t("password")}</span>
                <input
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={input}
                />
              </label>
            </div>
          </div>
        </details>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={pending} className={`${button.accent} w-full py-3 text-base`}>
          {pending ? t("starting") : t("start")}
        </button>
      </form>
    </main>
  );
}

export default function NewTestPage() {
  return (
    <>
      <Header />
      <RequireAuth>
        <NewTest />
      </RequireAuth>
    </>
  );
}
