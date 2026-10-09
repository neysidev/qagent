import type { RunDetails } from "@convex/runs";

type Entry = { title: string; status: string };
export type RunDiff = {
  regressed: { title: string; from: string; to: string }[];
  fixed: { title: string; from: string; to: string }[];
  added: Entry[];
  removed: Entry[];
  same: number;
  newBugs: { title: string; severity: string }[];
  resolvedBugs: { title: string; severity: string }[];
  persistingBugs: { title: string; severity: string }[];
};

const bad = (s: string) => s === "failed" || s === "error";
const key = (t: string) => t.trim().toLowerCase();

/** What changed from run `a` (older) to run `b` (newer): scenarios matched by title, bugs by title. */
export function diffRuns(a: RunDetails, b: RunDetails): RunDiff {
  const before = new Map(a.scenarios.map((s) => [key(s.title), s]));
  const after = new Map(b.scenarios.map((s) => [key(s.title), s]));
  const d: RunDiff = { regressed: [], fixed: [], added: [], removed: [], same: 0, newBugs: [], resolvedBugs: [], persistingBugs: [] };
  for (const [k, s] of after) {
    const p = before.get(k);
    if (!p) d.added.push({ title: s.title, status: s.status });
    else if (!bad(p.status) && bad(s.status)) d.regressed.push({ title: s.title, from: p.status, to: s.status });
    else if (bad(p.status) && !bad(s.status)) d.fixed.push({ title: s.title, from: p.status, to: s.status });
    else d.same++;
  }
  for (const [k, s] of before) if (!after.has(k)) d.removed.push({ title: s.title, status: s.status });
  const bugsBefore = new Set(a.bugs.map((x) => key(x.title)));
  const bugsAfter = new Set(b.bugs.map((x) => key(x.title)));
  for (const x of b.bugs) (bugsBefore.has(key(x.title)) ? d.persistingBugs : d.newBugs).push({ title: x.title, severity: x.severity });
  for (const x of a.bugs) if (!bugsAfter.has(key(x.title))) d.resolvedBugs.push({ title: x.title, severity: x.severity });
  return d;
}
