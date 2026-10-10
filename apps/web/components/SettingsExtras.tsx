"use client";

import { api } from "@convex/_generated/api";
import { useAction, useMutation, useQuery } from "convex/react";
import { Bell, ImagePlus, Send, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { errorKey } from "@/lib/format";
import { button, card, cardHeader, cardTitle, input, pill, segment, segmented, skeleton } from "./ui";

async function logoDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 256 / bmp.width, 96 / bmp.height);
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(bmp.width * scale));
  c.height = Math.max(1, Math.round(bmp.height * scale));
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}

export function BrandingCard() {
  const t = useTranslations("settings.branding");
  const te = useTranslations("errors");
  const viewer = useQuery(api.runs.viewer);
  const setBrand = useMutation(api.runs.setBrand);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | undefined>();
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewer) {
      setName(viewer.brand?.name ?? "");
      setLogo(viewer.brand?.logo);
    }
  }, [viewer]);

  async function save(brand: { name: string; logo?: string } | null) {
    try {
      await setBrand({ brand });
      toast.success(t("saved"), { id: "brand" });
    } catch (e) {
      toast.error(te(errorKey(e)), { id: "brand" });
    }
  }

  return (
    <section className={card}>
      <header className={cardHeader}>
        <h2 className={cardTitle}>{t("title")}</h2>
      </header>
      {viewer === undefined ? (
        <div className={`${skeleton} m-4 h-24`} />
      ) : (
        <div className="space-y-4 p-4">
          <p className="text-sm text-fg-3">{t("body")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-fg-2">{t("name")}</span>
              <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={input} />
            </label>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-fg-2">{t("logo")}</span>
              <div className="flex items-center gap-2">
                {logo && <img src={logo} alt="" className="h-9 w-auto max-w-32 rounded-md border border-line bg-white p-1" />}
                <input
                  ref={file}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void logoDataUrl(f).then(setLogo, () => toast.error(te("generic")));
                    e.target.value = "";
                  }}
                />
                <button type="button" onClick={() => file.current?.click()} className={button.secondary}>
                  <ImagePlus className="size-4" /> {t("upload")}
                </button>
                {logo && (
                  <button type="button" onClick={() => setLogo(undefined)} className={button.ghost}>{t("remove")}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <footer className="flex justify-end gap-2 border-t border-line px-4 py-3">
        {viewer?.brand && <button onClick={() => void save(null)} className={button.ghost}>{t("clear")}</button>}
        <button disabled={!name.trim()} onClick={() => void save({ name, logo })} className={button.primary}>{t("save")}</button>
      </footer>
    </section>
  );
}

type Kind = "slack" | "telegram" | "webhook";
const KINDS: Kind[] = ["slack", "telegram", "webhook"];

export function ChannelsCard() {
  const t = useTranslations("settings.channels");
  const te = useTranslations("errors");
  const channels = useQuery(api.integrations.list);
  const add = useMutation(api.integrations.add);
  const remove = useMutation(api.integrations.remove);
  const test = useAction(api.integrations.test);
  const [kind, setKind] = useState<Kind>("slack");
  const [target, setTarget] = useState("");
  const [secret, setSecret] = useState("");
  const [onlyFailures, setOnlyFailures] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await add({ kind, target, secret: secret || undefined, onlyFailures });
      setTarget("");
      setSecret("");
      setAdding(false);
    } catch (err) {
      setError(te(errorKey(err)));
    }
  }

  return (
    <section className={card}>
      <header className={cardHeader}>
        <h2 className={cardTitle}>
          <Bell className="size-4 text-fg-3" strokeWidth={1.75} /> {t("title")}
        </h2>
        {!adding && <button onClick={() => setAdding(true)} className={button.secondary}>{t("add")}</button>}
      </header>
      <p className="px-4 pt-4 text-sm text-fg-3">{t("body")}</p>
      {channels === undefined ? (
        <div className={`${skeleton} m-4 h-12`} />
      ) : channels.length === 0 && !adding ? (
        <p className="p-4 text-sm text-fg-2">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-line">
          {channels.map((c) => (
            <li key={c._id} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <span className={pill("accent")}>{t(c.kind)}</span>
              <span dir="ltr" className="min-w-0 flex-1 truncate font-mono text-xs text-fg-2">{c.label}</span>
              <span className="text-xs text-fg-3">{c.onlyFailures ? t("failuresOnly") : t("allResults")}</span>
              <button
                onClick={() => void test({ id: c._id }).then((ok) => (ok ? toast.success(t("testOk")) : toast.error(t("testFail"))), () => toast.error(t("testFail")))}
                className={`${button.ghost} h-8`}
              >
                <Send className="size-3.5" /> {t("test")}
              </button>
              <button onClick={() => void remove({ id: c._id })} aria-label={t("remove")} className={`${button.icon}`}>
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <form onSubmit={(e) => void onAdd(e)} className="space-y-3 border-t border-line p-4">
          <div className={segmented}>
            {KINDS.map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setTarget(""); setSecret(""); }} className={segment}>
                {t(k)}
              </button>
            ))}
          </div>
          {kind === "telegram" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input dir="ltr" required value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={t("tgToken")} className={input} />
              <input dir="ltr" required value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t("tgChat")} className={input} />
            </div>
          ) : (
            <>
              <input dir="ltr" required value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t(kind === "slack" ? "slackUrl" : "url")} className={input} />
              {kind === "webhook" && <input dir="ltr" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={t("secret")} className={input} />}
            </>
          )}
          <label className="flex items-center gap-2.5 text-sm text-fg-2">
            <input type="checkbox" checked={onlyFailures} onChange={(e) => setOnlyFailures(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            {t("onlyFailures")}
          </label>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setAdding(false); setError(null); }} className={button.ghost}>{t("cancel")}</button>
            <button className={button.primary}>{t("save")}</button>
          </div>
        </form>
      )}
    </section>
  );
}

export function DigestCard() {
  const t = useTranslations("settings.digest");
  const viewer = useQuery(api.runs.viewer);
  const setDigest = useMutation(api.runs.setWeeklyDigest);
  const on = viewer?.weeklyDigest ?? false;
  return (
    <section className={`${card} flex items-center justify-between gap-4 p-4`}>
      <div>
        <h2 className={cardTitle}>{t("title")}</h2>
        <p className="mt-1 text-sm text-fg-3">{t("body")}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={t("title")}
        disabled={viewer === undefined}
        onClick={() => void setDigest({ on: !on })}
        className="relative h-6 w-11 shrink-0 rounded-full bg-pixel-off transition-colors duration-150 aria-checked:bg-accent disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className={`absolute top-0.5 start-0.5 size-5 rounded-full bg-white shadow transition-transform duration-150 ${on ? "ltr:translate-x-5 rtl:-translate-x-5" : ""}`} />
      </button>
    </section>
  );
}
