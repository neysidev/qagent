import type { RunDetails } from "@convex/runs";
import { actionValue, hostOf } from "../format";
import { LABELS, type Labels, type Lang } from "./labels";

export type ExportFormat = "pdf" | "html" | "md" | "json" | "junit" | "csv";
export type ExportScope = "summary" | "failed" | "full";
export type Brand = { name: string; logo?: string } | null;

export type ExportOptions = {
  format: ExportFormat;
  scope: ExportScope;
  screenshots: boolean;
  diagnostics: boolean;
  timestamps: boolean;
  siteInfo: boolean;
  whiteLabel: boolean;
  lang: Lang;
  dir: "rtl" | "ltr";
};

export const DEFAULT_OPTIONS: ExportOptions = {
  format: "pdf",
  scope: "full",
  screenshots: true,
  diagnostics: true,
  timestamps: true,
  siteInfo: true,
  whiteLabel: false,
  lang: "fa",
  dir: "rtl",
};

type DocStep = { n: number; action: string; thought: string; page: string; ok: boolean; error?: string; ms?: number; shot?: string };
type DocScenario = { title: string; status: string; kind: string; reason: string; ms: number; steps: DocStep[] };
type DocBug = {
  title: string;
  severity: string;
  scenario?: string;
  expected?: string;
  actual?: string;
  repro: string[];
  screenshots: string[];
  console: string[];
  network: string[];
};
export type Doc = {
  brand: Brand;
  run: { id: string; url?: string; goal?: string; date?: string; durationMs?: number };
  counts: { total: number; passed: number; failed: number; bugs: number };
  summaryText?: string;
  bugs: DocBug[];
  scenarios: DocScenario[];
};

export function buildDoc(data: RunDetails, o: ExportOptions, brand: Brand): Doc {
  const { run, scenarios, steps, bugs } = data;
  const detail = o.scope !== "summary";
  const title = new Map(scenarios.map((s) => [s._id, s.title]));
  const shots = o.screenshots && detail;
  const bad = (status: string) => status === "failed" || status === "error";
  const picked = o.scope === "summary" ? [] : o.scope === "failed" ? scenarios.filter((s) => bad(s.status)) : scenarios;
  const end = run.finishedAt ?? run.startedAt ?? run.createdAt;
  return {
    brand: o.whiteLabel ? brand : null,
    run: {
      id: run._id,
      ...(o.siteInfo ? { url: run.url, goal: run.goal } : {}),
      ...(o.timestamps ? { date: new Date(run.createdAt).toISOString(), durationMs: end - (run.startedAt ?? run.createdAt) } : {}),
    },
    counts: {
      total: run.summary?.total ?? scenarios.length,
      passed: run.summary?.passed ?? scenarios.filter((s) => s.status === "passed").length,
      failed: run.summary?.failed ?? scenarios.filter((s) => bad(s.status)).length,
      bugs: bugs.length,
    },
    summaryText: run.summaryText,
    bugs: bugs.map((b) => ({
      title: b.title,
      severity: b.severity,
      scenario: title.get(b.scenarioId),
      ...(detail ? { expected: b.expected, actual: b.actual } : {}),
      repro: detail ? b.reproSteps : [],
      screenshots: shots ? b.screenshotUrls : [],
      console: detail && o.diagnostics ? b.evidence.consoleErrors : [],
      network: detail && o.diagnostics ? b.evidence.networkErrors.map((n) => `${n.method} ${n.url} → ${n.status || "failed"}`) : [],
    })),
    scenarios: picked.map((s) => {
      const own = o.scope === "full" ? steps.filter((x) => x.scenarioId === s._id) : [];
      return {
        title: s.title,
        status: s.status,
        kind: s.kind,
        reason: s.verdictReason ?? "",
        ms: steps.filter((x) => x.scenarioId === s._id).reduce((t, x) => t + x.durationMs, 0),
        steps: own.map((x, i) => ({
          n: i + 1,
          action: `${x.action.type}${actionValue(x) ? ` ${actionValue(x)}` : ""}`,
          thought: x.thought,
          page: x.pageUrl,
          ok: x.ok,
          ...(x.error ? { error: x.error } : {}),
          ...(o.timestamps ? { ms: x.durationMs } : {}),
          ...(shots && x.screenshotUrl ? { shot: x.screenshotUrl } : {}),
        })),
      };
    }),
  };
}

const fmtDate = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
const fmtDur = (ms: number, lang: Lang) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const pad = new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", { minimumIntegerDigits: 2 });
  return `${new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(Math.floor(s / 60))}:${pad.format(s % 60)}`;
};
const num = (n: number, lang: Lang) => new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(n);
const sev = (L: Labels, s: string) => L.severity[s as keyof Labels["severity"]] ?? s;
const stat = (L: Labels, s: string) => L.status[s as keyof Labels["status"]] ?? s;

function meta(d: Doc, L: Labels, lang: Lang): [string, string][] {
  const m: [string, string][] = [];
  if (d.run.url) m.push([L.site, d.run.url]);
  if (d.run.goal) m.push([L.goal, d.run.goal]);
  if (d.run.date) m.push([L.date, fmtDate(d.run.date, lang)]);
  if (d.run.durationMs !== undefined) m.push([L.duration, fmtDur(d.run.durationMs, lang)]);
  m.push([L.scenarioCount, `${num(d.counts.passed, lang)}/${num(d.counts.total, lang)}`], [L.bugs, num(d.counts.bugs, lang)]);
  return m;
}

export function toMarkdown(d: Doc, lang: Lang): string {
  const L = LABELS[lang];
  const out = [`# ${d.brand?.name ?? "QAgent"} | ${L.report}${d.run.url ? ` ${hostOf(d.run.url)}` : ""}`, ""];
  for (const [k, v] of meta(d, L, lang)) out.push(`- **${k}:** ${v}`);
  out.push("");
  if (d.summaryText) out.push(d.summaryText, "");
  out.push(`## ${L.bugs}`, "");
  if (!d.bugs.length) out.push(L.noBugs, "");
  for (const b of d.bugs) {
    out.push(`### [${sev(L, b.severity)}] ${b.title}`, "");
    if (b.repro.length) out.push(`**${L.repro}:**`, "", ...b.repro.map((s, i) => `${i + 1}. ${s}`), "");
    if (b.expected) out.push(`**${L.expected}:** ${b.expected}`, "");
    if (b.actual) out.push(`**${L.actual}:** ${b.actual}`, "");
    const ev = [...b.network, ...b.console];
    if (ev.length) out.push("```", ...ev, "```", "");
    b.screenshots.forEach((u, i) => out.push(`![${L.screenshots} ${i + 1}](${u})`));
    if (b.screenshots.length) out.push("");
  }
  if (d.scenarios.length) {
    out.push(`## ${L.scenarios}`, "");
    for (const s of d.scenarios) {
      out.push(`- **${stat(L, s.status)}** ${s.title}${s.reason ? ` | ${s.reason}` : ""}`);
      for (const st of s.steps) {
        out.push(`  ${st.n}. ${st.ok ? "" : "✗ "}\`${st.action}\` ${st.thought}`);
        if (st.shot) out.push(`     ![${st.n}](${st.shot})`);
      }
    }
  }
  return out.join("\n") + "\n";
}

export const toJson = (d: Doc) => JSON.stringify({ schema: "qagent.report.v1", ...d }, null, 2) + "\n";

const xml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

export function toJunit(d: Doc, lang: Lang): string {
  const L = LABELS[lang];
  const host = d.run.url ? hostOf(d.run.url) : "qagent";
  const bad = (s: string) => s === "failed" || s === "error";
  const cases = d.scenarios.length
    ? d.scenarios
    : [];
  const body = cases
    .map((s) => {
      const related = d.bugs.filter((b) => b.scenario === s.title);
      const text = related.map((b) => [`[${sev(L, b.severity)}] ${b.title}`, b.expected && `${L.expected}: ${b.expected}`, b.actual && `${L.actual}: ${b.actual}`, ...b.repro.map((r, i) => `${i + 1}. ${r}`)].filter(Boolean).join("\n")).join("\n\n");
      const inner =
        s.status === "failed"
          ? `<failure message="${xml(s.reason)}" type="scenario">${xml(text)}</failure>`
          : s.status === "error"
            ? `<error message="${xml(s.reason)}" type="scenario">${xml(text)}</error>`
            : s.status === "skipped" || s.status === "pending"
              ? "<skipped/>"
              : "";
      return `    <testcase classname="${xml(host)}" name="${xml(s.title)}" time="${(s.ms / 1000).toFixed(3)}">${inner}</testcase>`;
    })
    .join("\n");
  const failures = cases.filter((s) => s.status === "failed").length;
  const errors = cases.filter((s) => s.status === "error").length;
  const skipped = cases.filter((s) => s.status === "skipped" || s.status === "pending").length;
  const time = (d.run.durationMs ?? cases.reduce((t, s) => t + s.ms, 0)) / 1000;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n  <testsuite name="${xml(`${d.brand?.name ?? "QAgent"} ${host}`)}" tests="${cases.length}" failures="${failures}" errors="${errors}" skipped="${skipped}" time="${time.toFixed(3)}"${d.run.date ? ` timestamp="${d.run.date}"` : ""}>\n${body}\n  </testsuite>\n</testsuites>\n`;
}

const csvCell = (v: string | number | boolean | undefined) => {
  const s = String(v ?? "");
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

export function toCsv(d: Doc, lang: Lang): string {
  const L = LABELS[lang];
  const rows: (string | number | boolean | undefined)[][] = [["scenario", "status", "reason", "step", "action", "thought", "page", "ok", "duration_ms", "error"]];
  for (const s of d.scenarios) {
    if (!s.steps.length) rows.push([s.title, stat(L, s.status), s.reason]);
    for (const st of s.steps) rows.push([s.title, stat(L, s.status), s.reason, st.n, st.action, st.thought, st.page, st.ok, st.ms, st.error]);
  }
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

const esc = xml;
const CSS = `*{box-sizing:border-box}body{margin:0;background:#f6f5f2;color:#1c1b1a;font:15px/1.8 Peyda,system-ui,"Segoe UI",sans-serif}
main{max-width:860px;margin:0 auto;padding:32px 20px}header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
header img{height:36px;width:auto;border-radius:6px}header b{font-size:15px}h1{font-size:24px;margin:0 0 16px;line-height:1.4}
h2{font-size:17px;margin:28px 0 12px}dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 16px;margin:0 0 20px;padding:14px 16px;background:#fff;border:1px solid #e6e3dc;border-radius:12px}
dt{color:#8a867d}dd{margin:0;word-break:break-word}.card{background:#fff;border:1px solid #e6e3dc;border-radius:12px;padding:16px;margin-bottom:12px;break-inside:avoid}
.tag{display:inline-block;border-radius:999px;padding:0 10px;font-size:12px;background:#eee;color:#55524b;margin-inline-end:8px}
.critical,.high,.failed,.error{background:#fde8e6;color:#b42318}.medium{background:#fef3dc;color:#a15c07}.passed{background:#dcf5e5;color:#18794e}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}.box{border-radius:8px;padding:10px 12px;font-size:14px}.exp{background:#eefaf2}.act{background:#fdf0ee}
.box b,h4{display:block;font-size:12px;color:#8a867d;margin:0 0 2px;font-weight:600}h4{margin:12px 0 4px}ol{margin:0;padding-inline-start:22px}
pre{direction:ltr;text-align:left;overflow:auto;background:#f3f1ec;border-radius:8px;padding:10px;font-size:12px;white-space:pre-wrap;word-break:break-all}
img.shot{max-width:100%;border:1px solid #e6e3dc;border-radius:8px;margin:6px 6px 0 0;vertical-align:top}.bug img.shot{max-height:220px}
details{margin-top:6px}summary{cursor:pointer;color:#55524b}.step{padding:8px 0;border-top:1px solid #eee;font-size:14px}.step code{direction:ltr;unicode-bidi:embed;background:#f3f1ec;border-radius:4px;padding:0 5px}
.bad{color:#b42318}footer{margin-top:32px;text-align:center;color:#8a867d;font-size:12px}
@page{margin:14mm}@media print{body{background:#fff}main{padding:0}details[open] summary{display:none}}@media(max-width:600px){.cols{grid-template-columns:1fr}}`;

export function toHtml(d: Doc, lang: Lang, dir: "rtl" | "ltr", img: (u: string) => string = (u) => u, fontCss = ""): string {
  const L = LABELS[lang];
  const shot = (u: string) => `<img class="shot" src="${esc(img(u))}" alt="">`;
  const bugs = d.bugs.length
    ? d.bugs
        .map(
          (b) => `<article class="card bug"><p style="margin:0"><span class="tag ${esc(b.severity)}">${esc(sev(L, b.severity))}</span><b>${esc(b.title)}</b></p>
${b.expected || b.actual ? `<div class="cols" style="margin-top:10px"><div class="box exp"><b>${L.expected}</b>${esc(b.expected ?? "")}</div><div class="box act"><b>${L.actual}</b>${esc(b.actual ?? "")}</div></div>` : ""}
${b.repro.length ? `<h4>${L.repro}</h4><ol>${b.repro.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>` : ""}
${b.screenshots.length ? `<h4>${L.screenshots}</h4>${b.screenshots.map(shot).join("")}` : ""}
${b.network.length ? `<details><summary>${L.network} (${num(b.network.length, lang)})</summary><pre>${esc(b.network.join("\n"))}</pre></details>` : ""}
${b.console.length ? `<details><summary>${L.console} (${num(b.console.length, lang)})</summary><pre>${esc(b.console.join("\n"))}</pre></details>` : ""}</article>`,
        )
        .join("\n")
    : `<p>${L.noBugs}</p>`;
  const scenarios = d.scenarios
    .map(
      (s) => `<article class="card"><p style="margin:0"><span class="tag ${esc(s.status)}">${esc(stat(L, s.status))}</span><b>${esc(s.title)}</b></p>${s.reason ? `<p style="margin:4px 0 0;color:#55524b">${esc(s.reason)}</p>` : ""}
${s.steps.length ? `<details><summary>${L.steps} (${num(s.steps.length, lang)})</summary>${s.steps.map((st) => `<div class="step${st.ok ? "" : " bad"}">${num(st.n, lang)}. <code>${esc(st.action)}</code> ${esc(st.thought)}${st.error ? ` | ${esc(st.error)}` : ""}${st.shot ? `<br>${shot(st.shot)}` : ""}</div>`).join("")}</details>` : ""}</article>`,
    )
    .join("\n");
  const brand = d.brand?.name ?? "QAgent";
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(`${brand} | ${L.report}${d.run.url ? ` ${hostOf(d.run.url)}` : ""}`)}</title><style>${fontCss}${CSS}</style></head><body><main>
<header>${d.brand?.logo ? `<img src="${esc(d.brand.logo)}" alt="">` : ""}<b>${esc(brand)}</b></header>
<h1>${L.report}${d.run.url ? ` ${esc(hostOf(d.run.url))}` : ""}</h1>
<dl>${meta(d, L, lang).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
${d.summaryText ? `<h2>${L.summary}</h2><p>${esc(d.summaryText)}</p>` : ""}
<h2>${L.bugs}</h2>${bugs}
${scenarios ? `<h2>${L.scenarios}</h2>${scenarios}` : ""}
${d.brand ? "" : `<footer>${L.madeWith}</footer>`}</main></body></html>`;
}

export type RenderedFile = { name: string; mime: string; text: string };

const EXT = { pdf: "html", html: "html", md: "md", json: "json", junit: "xml", csv: "csv" } as const;
const MIME = { html: "text/html", md: "text/markdown", json: "application/json", xml: "application/xml", csv: "text/csv" } as const;

export const fileName = (d: Doc, ext: string) => {
  const host = d.run.url ? hostOf(d.run.url).replace(/[^\w.-]/g, "_") : "run";
  return `qagent-${host}-${d.run.date?.slice(0, 10) ?? "report"}-${d.run.id.slice(-6)}.${ext}`;
};

export function render(d: Doc, o: ExportOptions, img?: (u: string) => string, fontCss?: string): RenderedFile {
  const ext = EXT[o.format];
  const text =
    o.format === "md" ? toMarkdown(d, o.lang)
    : o.format === "json" ? toJson(d)
    : o.format === "junit" ? toJunit(d, o.lang)
    : o.format === "csv" ? toCsv(d, o.lang)
    : toHtml(d, o.lang, o.dir, img, fontCss);
  return { name: fileName(d, ext), mime: `${MIME[ext]};charset=utf-8`, text };
}

export const imageUrls = (d: Doc) => [...new Set([...d.bugs.flatMap((b) => b.screenshots), ...d.scenarios.flatMap((s) => s.steps.flatMap((x) => (x.shot ? [x.shot] : [])))])];
