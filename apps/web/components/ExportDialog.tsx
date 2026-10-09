"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { RunDetails } from "@convex/runs";
import { useConvex, useQuery } from "convex/react";
import { zipSync, strToU8 } from "fflate";
import { Braces, Code, FileText, Globe, Table, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { buildDoc, DEFAULT_OPTIONS, render, type Brand, type ExportFormat, type ExportOptions } from "@/lib/export";
import { deliver, download, peydaFiles, PEYDA_RELATIVE_CSS } from "@/lib/export/browser";
import { Modal } from "./overlay";
import { button, segment, segmented } from "./ui";

const FORMATS: { key: ExportFormat; icon: LucideIcon }[] = [
  { key: "pdf", icon: FileText },
  { key: "html", icon: Globe },
  { key: "md", icon: Code },
  { key: "json", icon: Braces },
  { key: "junit", icon: Code },
  { key: "csv", icon: Table },
];

const STORE = "qagent:export-options";

/** Last choices, remembered per browser. Storage can be blocked or empty, so every access is guarded. */
function useOptions(brand: Brand, bulk: boolean) {
  const [o, setO] = useState<ExportOptions>(DEFAULT_OPTIONS);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "null");
      if (saved) setO({ ...DEFAULT_OPTIONS, ...saved });
    } catch {}
  }, []);
  // A brand removed in settings must not stay switched on; bulk has no PDF and no embedded screenshots.
  const eff: ExportOptions = {
    ...o,
    whiteLabel: o.whiteLabel && !!brand,
    ...(bulk ? { screenshots: false, format: o.format === "pdf" ? "html" : o.format } : {}),
  };
  const set = (patch: Partial<ExportOptions>) => setO((p) => ({ ...p, ...patch }));
  const remember = () => {
    try {
      localStorage.setItem(STORE, JSON.stringify(o));
    } catch {}
  };
  return { o: eff, set, remember };
}

function Check({ checked, onChange, children, disabled, hint }: { checked: boolean; onChange: (v: boolean) => void; children: string; disabled?: boolean; hint?: string }) {
  return (
    <label className={`flex items-center gap-2.5 text-sm ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--accent)]" />
      <span className="text-fg-2">{children}</span>
      {hint && <span className="text-xs text-fg-3">{hint}</span>}
    </label>
  );
}

function Segmented<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: [T, string][] }) {
  return (
    <div className={segmented}>
      {items.map(([k, label]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)} className={segment}>
          {label}
        </button>
      ))}
    </div>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-fg-3">{title}</p>
      {children}
    </div>
  );
}

function OptionsForm({ o, set, brand, bulk }: { o: ExportOptions; set: (p: Partial<ExportOptions>) => void; brand: Brand; bulk: boolean }) {
  const t = useTranslations("export");
  const human = o.format === "pdf" || o.format === "html" || o.format === "md";
  return (
    <>
      <Field title={t("format")}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {FORMATS.filter((f) => !bulk || f.key !== "pdf").map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={o.format === key}
              onClick={() => set({ format: key })}
              className="rounded-xl border border-line bg-card p-3 text-start transition-[border-color,box-shadow] hover:border-line-strong aria-pressed:border-accent aria-pressed:shadow-[0_0_0_3px_var(--accent-soft)] focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Icon className="size-4 text-fg-3" strokeWidth={1.75} aria-hidden />
              <p className="mt-1.5 text-sm font-medium">{t(`formats.${key}.0`)}</p>
              <p className="text-xs text-fg-3">{t(`formats.${key}.1`)}</p>
            </button>
          ))}
        </div>
      </Field>

      <Field title={t("content")}>
        <Segmented value={o.scope} onChange={(scope) => set({ scope })} items={[["summary", t("scopes.summary")], ["failed", t("scopes.failed")], ["full", t("scopes.full")]]} />
        <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
          {!bulk && o.format !== "junit" && o.format !== "csv" && (
            <Check checked={o.screenshots} onChange={(screenshots) => set({ screenshots })}>{t("screenshots")}</Check>
          )}
          {o.format !== "junit" && o.format !== "csv" && <Check checked={o.diagnostics} onChange={(diagnostics) => set({ diagnostics })}>{t("diagnostics")}</Check>}
          <Check checked={o.timestamps} onChange={(timestamps) => set({ timestamps })}>{t("timestamps")}</Check>
          <Check checked={o.siteInfo} onChange={(siteInfo) => set({ siteInfo })}>{t("siteInfo")}</Check>
          {human && <Check checked={o.whiteLabel} onChange={(whiteLabel) => set({ whiteLabel })} disabled={!brand}>{t("whiteLabel")}</Check>}
        </div>
        {human && !brand && (
          <Link href="/settings" className="text-xs text-accent hover:underline">{t("whiteLabelHint")}</Link>
        )}
      </Field>

      {human && (
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Field title={t("lang")}>
            <Segmented value={o.lang} onChange={(lang) => set({ lang, dir: lang === "fa" ? "rtl" : "ltr" })} items={[["fa", t("langFa")], ["en", t("langEn")]]} />
          </Field>
          {o.format !== "md" && (
            <Field title={t("dir")}>
              <Segmented value={o.dir} onChange={(dir) => set({ dir })} items={[["rtl", t("rtl")], ["ltr", t("ltr")]]} />
            </Field>
          )}
        </div>
      )}
    </>
  );
}

export function ExportDialog({ open, onClose, data }: { open: boolean; onClose: () => void; data: RunDetails }) {
  const t = useTranslations("export");
  const viewer = useQuery(api.runs.viewer);
  const brand = viewer?.brand ?? null;
  const { o, set, remember } = useOptions(brand, false);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      await deliver(buildDoc(data, o, brand), o);
      remember();
      if (o.format === "pdf") toast.message(t("pdfHint"), { id: "pdf-hint" });
      onClose();
    } catch {
      toast.error(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("title")}
      wide
      footer={
        <>
          <button onClick={onClose} className={button.ghost}>{t("cancel")}</button>
          <button onClick={() => void go()} disabled={busy} className={button.primary}>
            {busy ? t("working") : o.format === "pdf" ? t("savePdf") : t("download")}
          </button>
        </>
      }
    >
      <OptionsForm o={o} set={set} brand={brand} bulk={false} />
    </Modal>
  );
}

type RunRow = { _id: Id<"runs">; status: string; createdAt: number };
const DAY = 86_400_000;

/** All finished tests of a project (optionally a recent range) as one zip: a file per run plus an index.csv. */
export function BulkExportDialog({ open, onClose, runs, projectName }: { open: boolean; onClose: () => void; runs: RunRow[]; projectName: string }) {
  const t = useTranslations("export");
  const convex = useConvex();
  const viewer = useQuery(api.runs.viewer);
  const brand = viewer?.brand ?? null;
  const { o, set, remember } = useOptions(brand, true);
  const [range, setRange] = useState<0 | 7 | 30>(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const picked = runs.filter((r) => r.status === "done" && (range === 0 || r.createdAt > Date.now() - range * DAY));

  async function go() {
    setProgress({ done: 0, total: picked.length });
    try {
      const files: Record<string, Uint8Array> = {};
      const index = ["run,date,status,scenarios_passed,scenarios_total,bugs,url"];
      for (const [i, r] of picked.entries()) {
        const data = await convex.query(api.runs.get, { runId: r._id });
        const doc = buildDoc(data, o, brand);
        const f = render(doc, o, undefined, PEYDA_RELATIVE_CSS);
        files[f.name] = strToU8(f.text.replace(/^﻿/, "")).length ? strToU8(f.text) : strToU8("");
        const c = doc.counts;
        index.push([r._id, new Date(r.createdAt).toISOString(), data.run.status, c.passed, c.total, c.bugs, `"${data.run.url}"`].join(","));
        setProgress({ done: i + 1, total: picked.length });
      }
      if (o.format === "html") Object.assign(files, await peydaFiles());
      files["index.csv"] = strToU8("﻿" + index.join("\r\n") + "\r\n");
      download(`qagent-${projectName.replace(/[^\w.-]/g, "_")}.zip`, "application/zip", zipSync(files) as BlobPart);
      remember();
      onClose();
    } catch {
      toast.error(t("failed"));
    } finally {
      setProgress(null);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("bulkTitle")}
      wide
      footer={
        <>
          <button onClick={onClose} className={button.ghost}>{t("cancel")}</button>
          <button onClick={() => void go()} disabled={!picked.length || progress !== null} className={button.primary}>
            {progress ? t("progress", { done: progress.done, total: progress.total }) : t("download")}
          </button>
        </>
      }
    >
      <Field title={t("range")}>
        <Segmented value={String(range) as "0" | "7" | "30"} onChange={(v) => setRange(Number(v) as 0 | 7 | 30)} items={[["0", t("all")], ["7", t("d7")], ["30", t("d30")]]} />
        <p className="text-xs text-fg-3">{t("bulkCount", { n: picked.length })}</p>
      </Field>
      <OptionsForm o={o} set={set} brand={brand} bulk />
    </Modal>
  );
}
