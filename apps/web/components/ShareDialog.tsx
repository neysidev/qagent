"use client";

import { api } from "@convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { Check, Copy, Mail, Send, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { errorKey, type Run } from "@/lib/format";
import { Modal } from "./overlay";
import { button, input } from "./ui";

const DAY = 86_400_000;
const DAYS = [0, 1, 7, 30] as const;

/** Nearest preset to a stored expiry, so the select shows what was chosen. */
const presetOf = (expiresAt?: number) => (expiresAt ? DAYS.slice(1).reduce((a, d) => (Math.abs(d * DAY - (expiresAt - Date.now())) < Math.abs(a * DAY - (expiresAt - Date.now())) ? d : a), 30 as number) : 0);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-xs font-medium text-fg-3">{title}</h3>
      {children}
    </section>
  );
}

/** One place for everything that sends a report to someone: public link, email, connected channels. */
export function ShareDialog({ open, onClose, run }: { open: boolean; onClose: () => void; run: Run }) {
  const t = useTranslations("share");
  const te = useTranslations("errors");
  const share = useMutation(api.runs.share);
  const unshare = useMutation(api.runs.unshare);
  const sendEmail = useAction(api.email.sendReport);
  const sendChannels = useAction(api.integrations.sendRun);
  const channels = useQuery(api.integrations.list);
  const [days, setDays] = useState(0);
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState<null | "link" | "email" | "channels">(null);
  const [copied, setCopied] = useState(false);
  const link = run.shareToken ? `${location.origin}/share/${run.shareToken}` : null;

  useEffect(() => {
    if (open) setDays(presetOf(run.shareExpiresAt));
  }, [open, run.shareExpiresAt]);

  async function guard(kind: NonNullable<typeof busy>, fn: () => Promise<void>) {
    setBusy(kind);
    try {
      await fn();
    } catch (e) {
      toast.error(te(errorKey(e)));
    } finally {
      setBusy(null);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(te("generic"));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("title")} footer={<button onClick={onClose} className={button.ghost}>{t("close")}</button>}>
      <Section title={t("link")}>
        {link ? (
          <>
            <div className="flex gap-2">
              <input readOnly dir="ltr" value={link} onFocus={(e) => e.currentTarget.select()} className={`${input} font-mono text-xs`} />
              <button onClick={() => void copy(link)} className={`${button.secondary} shrink-0`}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {t("copy")}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-fg-2">
                {t("expiry")}
                <select
                  value={days}
                  disabled={busy === "link"}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setDays(d);
                    void guard("link", async () => void (await share({ runId: run._id, expiresInDays: d })));
                  }}
                  className={`${input} h-9 w-auto pe-8`}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d === 0 ? t("never") : t(`d${d}`)}</option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => void guard("link", async () => { await unshare({ runId: run._id }); toast.success(t("revoked")); })}
                className={button.danger}
              >
                <Unlink className="size-4" /> {t("revoke")}
              </button>
            </div>
            {run.shareExpiresAt && (
              <p className="text-xs text-fg-3">{t("expiresOn", { date: new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(run.shareExpiresAt) })}</p>
            )}
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={t("expiry")} className={`${input} h-9 w-auto pe-8`}>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d === 0 ? t("never") : t(`d${d}`)}</option>
              ))}
            </select>
            <button
              disabled={busy === "link"}
              onClick={() => void guard("link", async () => { const tok = await share({ runId: run._id, expiresInDays: days }); void copy(`${location.origin}/share/${tok}`); })}
              className={button.primary}
            >
              {t("create")}
            </button>
            <p className="w-full text-xs text-fg-3">{t("hint")}</p>
          </div>
        )}
      </Section>

      <Section title={t("email")}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void guard("email", async () => {
              const n = await sendEmail({ runId: run._id, to: emails.split(/[,\s،]+/).filter(Boolean) });
              toast.success(t("sentEmail", { n }));
              setEmails("");
            });
          }}
        >
          <input dir="ltr" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={t("emailPlaceholder")} className={input} />
          <button disabled={!emails.trim() || busy === "email"} className={`${button.secondary} shrink-0`}>
            <Mail className="size-4" /> {t("send")}
          </button>
        </form>
      </Section>

      <Section title={t("channels")}>
        {channels?.length ? (
          <button
            disabled={busy === "channels"}
            onClick={() => void guard("channels", async () => { const r = await sendChannels({ runId: run._id }); toast.success(t("sentChannels", r)); })}
            className={button.secondary}
          >
            <Send className="size-4" /> {t("sendChannels")}
          </button>
        ) : (
          <p className="text-sm text-fg-3">
            {t("noChannels")}، <Link href="/settings" className="text-accent hover:underline">{t("connect")}</Link>
          </p>
        )}
      </Section>
    </Modal>
  );
}
