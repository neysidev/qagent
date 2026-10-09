"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Copy, ExternalLink, Settings2, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { errorKey, type Bug, type Run } from "@/lib/format";
import { bugText, issueLink, type Tracker } from "@/lib/export/issues";
import { useWorkspace } from "./AppShell";
import { menuItem, Modal, Popover } from "./overlay";
import { button, input, segment, segmented } from "./ui";

const KINDS = ["github", "linear", "jira"] as const;

/** Per-bug menu: copy as text, or open a pre-filled ticket in the project's tracker. */
export function BugActions({ bug, run }: { bug: Bug; run: Run }) {
  const t = useTranslations("issue");
  const { projects } = useWorkspace();
  const tracker = projects?.find((p) => p._id === run.projectId)?.tracker as Tracker | undefined;
  const [setup, setSetup] = useState(false);

  async function copy(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
    } catch {
      toast.error(message);
    }
  }

  function create(tr: Tracker) {
    const { url, body } = issueLink(tr, bug, run);
    void navigator.clipboard.writeText(body).then(() => toast.message(t("opened"), { id: "issue-copied" }), () => {});
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <Popover
        align="end"
        className="w-60"
        trigger={({ toggle, open }) => (
          <button onClick={toggle} aria-expanded={open} aria-label={t("menu")} className={`${button.ghost} h-8 shrink-0 px-2.5 text-xs`}>
            <Ticket className="size-3.5" strokeWidth={1.75} /> {t("menu")}
          </button>
        )}
      >
        {(close) => (
          <>
            <button onClick={() => { close(); void copy(bugText(bug, run), t("copied")); }} className={menuItem}>
              <Copy className="size-4" strokeWidth={1.75} /> {t("copyText")}
            </button>
            {tracker ? (
              <>
                <button onClick={() => { close(); create(tracker); }} className={menuItem}>
                  <ExternalLink className="size-4" strokeWidth={1.75} /> {t("create", { tracker: t(tracker.kind) })}
                </button>
                <button onClick={() => { close(); setSetup(true); }} className={menuItem}>
                  <Settings2 className="size-4" strokeWidth={1.75} /> {t("change")}
                </button>
              </>
            ) : (
              <button onClick={() => { close(); setSetup(true); }} className={menuItem}>
                <Settings2 className="size-4" strokeWidth={1.75} /> {t("setup")}
              </button>
            )}
          </>
        )}
      </Popover>
      <TrackerDialog open={setup} onClose={() => setSetup(false)} projectId={run.projectId} current={tracker} />
    </>
  );
}

function TrackerDialog({ open, onClose, projectId, current }: { open: boolean; onClose: () => void; projectId: Id<"projects">; current?: Tracker }) {
  const t = useTranslations("issue");
  const te = useTranslations("errors");
  const setTracker = useMutation(api.runs.setTracker);
  const [kind, setKind] = useState<Tracker["kind"]>(current?.kind ?? "github");
  const [target, setTarget] = useState(current?.target ?? "");
  const [pid, setPid] = useState(current?.projectId ?? "");
  const [error, setError] = useState<string | null>(null);

  async function save(next: Tracker | null) {
    setError(null);
    try {
      await setTracker({ projectId, tracker: next });
      onClose();
    } catch (e) {
      setError(te(errorKey(e)));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("setupTitle")}
      footer={
        <>
          {current && <button onClick={() => void save(null)} className={`${button.danger} me-auto`}>{t("remove")}</button>}
          <button onClick={onClose} className={button.ghost}>{t("cancel")}</button>
          <button
            onClick={() => void save({ kind, target, ...(kind === "jira" ? { projectId: pid } : {}) })}
            disabled={!target.trim()}
            className={button.primary}
          >
            {t("save")}
          </button>
        </>
      }
    >
      <div className={segmented}>
        {KINDS.map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setTarget(""); }} className={segment}>
            {t(k)}
          </button>
        ))}
      </div>
      <input dir="ltr" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={t(kind === "jira" ? "jiraSite" : `${kind}Target`)} className={input} />
      {kind === "jira" && <input dir="ltr" value={pid} onChange={(e) => setPid(e.target.value)} placeholder={t("jiraProject")} className={input} />}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </Modal>
  );
}
