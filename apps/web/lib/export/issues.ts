import type { Bug, Run } from "../format";
import { LABELS } from "./labels";

export type Tracker = { kind: "github" | "linear" | "jira"; target: string; projectId?: string };

const L = LABELS.fa;

/** Plain-text bug report, ready to paste anywhere. */
export function bugText(b: Bug, run: Pick<Run, "url">, flavor: "md" | "jira" | "plain" = "plain"): string {
  const h = (s: string) => (flavor === "md" ? `**${s}**` : flavor === "jira" ? `*${s}*` : s);
  const img = (u: string) => (flavor === "md" ? `![](${u})` : flavor === "jira" ? `!${u}!` : u);
  const code = (s: string) => (flavor === "md" ? `\`\`\`\n${s}\n\`\`\`` : flavor === "jira" ? `{code}\n${s}\n{code}` : s);
  const ev = [...b.evidence.networkErrors.map((n) => `${n.method} ${n.url} → ${n.status || "failed"}`), ...b.evidence.consoleErrors];
  return [
    `${h(L.severity[b.severity])} | ${run.url}`,
    "",
    `${h(L.expected)}: ${b.expected}`,
    `${h(L.actual)}: ${b.actual}`,
    "",
    h(L.repro),
    ...b.reproSteps.map((s, i) => `${i + 1}. ${s}`),
    ...(ev.length ? ["", code(ev.slice(0, 20).join("\n"))] : []),
    ...(b.screenshotUrls.length ? ["", ...b.screenshotUrls.map(img)] : []),
  ].join("\n");
}

const MAX_BODY = 3500; // keeps the whole URL under what browsers and trackers accept

/** Link that opens the tracker's new-issue page pre-filled, plus the full text to copy when the link cannot carry it all. */
export function issueLink(t: Tracker, b: Bug, run: Pick<Run, "url">): { url: string; body: string } {
  const body = bugText(b, run, t.kind === "jira" ? "jira" : "md");
  const short = body.length > MAX_BODY ? `${body.slice(0, MAX_BODY)}…` : body;
  const q = new URLSearchParams({ title: b.title });
  if (t.kind === "github") {
    q.set("body", short);
    return { url: `https://github.com/${t.target}/issues/new?${q}`, body };
  }
  if (t.kind === "linear") {
    q.set("description", short);
    return { url: `https://linear.app/team/${t.target}/new?${q}`, body };
  }
  // Jira's create form takes numeric ids; issuetype 10004 is not universal, so the form's own default type is kept.
  const j = new URLSearchParams({ pid: t.projectId ?? "", summary: b.title, description: short });
  return { url: `https://${t.target}/secure/CreateIssueDetails!init.jspa?${j}`, body };
}
