"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useWorkspace } from "@/components/AppShell";

export type NotifKind = "failed" | "bugs" | "clean";

const KEY = "qagent.notifState";
type State = { read: string[]; hidden: string[] };
const EMPTY = '{"read":[],"hidden":[]}';
const listeners = new Set<() => void>();

const snapshot = () => {
  try {
    return localStorage.getItem(KEY) ?? EMPTY;
  } catch {
    return EMPTY;
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};
const write = (s: State) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  listeners.forEach((l) => l());
};

export function useNotifications() {
  const { runs } = useWorkspace();
  const raw = useSyncExternalStore(subscribe, snapshot, () => EMPTY);

  const items = useMemo(() => {
    const s: State = JSON.parse(raw);
    const read = new Set(s.read);
    const hidden = new Set(s.hidden);
    return (runs ?? [])
      .filter((r) => r.finishedAt && r.status !== "canceled" && !hidden.has(r._id))
      .map((r) => ({
        run: r,
        at: r.finishedAt!,
        read: read.has(r._id),
        kind: (r.status === "failed" ? "failed" : (r.summary?.bugs ?? 0) > 0 ? "bugs" : "clean") as NotifKind,
      }));
  }, [runs, raw]);

  const update = useCallback((fn: (read: Set<string>, hidden: Set<string>) => void) => {
    const s: State = JSON.parse(snapshot());
    const read = new Set(s.read);
    const hidden = new Set(s.hidden);
    fn(read, hidden);
    write({ read: [...read].slice(-300), hidden: [...hidden].slice(-300) });
  }, []);

  return {
    loading: runs === undefined,
    items,
    unread: items.filter((n) => !n.read).length,
    setRead: (id: string, value: boolean) => update((r) => void (value ? r.add(id) : r.delete(id))),
    markAllRead: (ids: string[]) => update((r) => ids.forEach((id) => r.add(id))),
    dismiss: (ids: string[]) => update((r, h) => ids.forEach((id) => (r.add(id), h.add(id)))),
  };
}
