"use client";

import { Bell, Check, CheckCheck, Circle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { QuietBellIllustration, SearchEmptyIllustration } from "@/components/illustrations";
import { TaskIcon } from "@/components/StatusBadge";
import { button, card, segment, segmented, skeleton } from "@/components/ui";
import { hostOf, nf, timeAgo } from "@/lib/format";
import { useNotifications, type NotifKind } from "@/lib/useNotifications";

const KINDS: ("all" | NotifKind)[] = ["all", "bugs", "clean", "failed"];

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const n = useNotifications();
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const shown = n.items.filter((i) => (kind === "all" || i.kind === kind) && (!unreadOnly || !i.read));
  const shownUnread = shown.filter((i) => !i.read).map((i) => i.run._id);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 max-lg:pt-14 sm:px-8">
      <div className="pb-1">
        <h1 className="text-[28px] leading-[1.3] font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-fg-3">{n.unread ? t("unreadCount", { count: nf.format(n.unread) }) : t("allRead")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className={segmented} role="group" aria-label={t("filterKind")}>
          {KINDS.map((k) => (
            <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)} className={segment}>{t(`kind.${k}`)}</button>
          ))}
        </div>
        <button aria-pressed={unreadOnly} onClick={() => setUnreadOnly((v) => !v)} className={`${segment} border border-line bg-surface aria-pressed:border-line-strong`}>
          {t("unreadOnly")}
        </button>
        <div className="ms-auto flex items-center gap-1">
          <button disabled={!shownUnread.length} onClick={() => n.markAllRead(shownUnread)} className={button.ghost}>
            <CheckCheck className="size-4" strokeWidth={1.75} /> {t("markAllRead")}
          </button>
          <button disabled={!shown.length} onClick={() => n.dismiss(shown.map((i) => i.run._id))} className={button.ghost}>
            <X className="size-4" strokeWidth={1.75} /> {t("clear")}
          </button>
        </div>
      </div>

      <section className={`${card} overflow-hidden`} aria-live="polite">
        {n.loading ? (
          <div className="space-y-px p-2">{[0, 1, 2, 3].map((i) => <div key={i} className={`${skeleton} h-16`} />)}</div>
        ) : shown.length === 0 ? (
          n.items.length === 0 ? (
            <EmptyState art={<QuietBellIllustration className="w-40" />} title={t("emptyTitle")} body={t("emptyBody")} />
          ) : (
            <EmptyState
              art={<SearchEmptyIllustration className="w-40" />}
              title={t("noMatch")}
              body={t("noMatchBody")}
              action={<button className={button.secondary} onClick={() => (setKind("all"), setUnreadOnly(false))}>{t("resetFilters")}</button>}
            />
          )
        ) : (
          <ul className="divide-y divide-line">
            {shown.map(({ run, at, read, kind: k }) => (
              <li key={run._id} className={`group relative flex items-start gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-card-hover ${read ? "" : "bg-accent-soft/40"}`}>
                <span className="mt-1"><TaskIcon status={run.status} bugs={run.summary?.bugs} /></span>
                <Link
                  href={`/runs/${run._id}`}
                  onClick={() => n.setRead(run._id, true)}
                  className="min-w-0 flex-1 rounded-md after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className={`block truncate text-sm ${read ? "text-fg-2" : "font-bold text-fg"}`}>{run.goal}</span>
                  <span className="mt-1 block truncate text-xs text-fg-3">
                    {t(`message.${k}`, { count: nf.format(run.summary?.bugs ?? 0) })} · <span dir="ltr">{hostOf(run.url)}</span> · {timeAgo(at)}
                  </span>
                </Link>
                <div className="relative z-10 flex shrink-0 items-center gap-0.5">
                  <button onClick={() => n.setRead(run._id, !read)} aria-label={read ? t("markUnread") : t("markRead")} title={read ? t("markUnread") : t("markRead")} className={`${button.icon} border-0 bg-transparent`}>
                    {read ? <Circle className="size-4" strokeWidth={1.75} /> : <Check className="size-4" strokeWidth={1.75} />}
                  </button>
                  <button onClick={() => n.dismiss([run._id])} aria-label={t("dismiss")} title={t("dismiss")} className={`${button.icon} border-0 bg-transparent hover:text-danger`}>
                    <X className="size-4" strokeWidth={1.75} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      {n.items.length > 0 && <p className="flex items-center gap-1.5 text-xs text-fg-3"><Bell className="size-3.5" aria-hidden /> {t("footnote")}</p>}
    </div>
  );
}
