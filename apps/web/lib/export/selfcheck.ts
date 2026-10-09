// Run: esbuild lib/export/selfcheck.ts --bundle --platform=node --format=esm --outfile=/tmp/sc.mjs && node /tmp/sc.mjs
import assert from "node:assert";
import { buildDoc, DEFAULT_OPTIONS, render, toCsv, toJunit } from ".";
import { diffRuns } from "../diff";

const run = { _id: "r1abcdef", url: "https://shop.example/", goal: "cart", createdAt: 1, startedAt: 1, finishedAt: 5001, status: "done", summary: { total: 2, passed: 1, failed: 1, bugs: 1 } };
const data: any = {
  run,
  scenarios: [
    { _id: "s1", title: "ok", status: "passed", kind: "happy", verdictReason: "" },
    { _id: "s2", title: "=cmd <b>", status: "failed", kind: "edge", verdictReason: "boom" },
  ],
  steps: [{ scenarioId: "s2", action: { type: "click", value: "{{password}}" }, thought: "t", pageUrl: "u", ok: false, error: "e", durationMs: 100, createdAt: 1, screenshotUrl: "https://x/y.png" }],
  bugs: [{ scenarioId: "s2", title: "Bug", severity: "high", expected: "a", actual: "b", reproSteps: ["1"], screenshotUrls: [], evidence: { consoleErrors: ["c"], networkErrors: [{ method: "GET", url: "/x", status: 500 }] } }],
};
const all = (o = {}) => buildDoc(data, { ...DEFAULT_OPTIONS, ...o }, null);

assert.match(toJunit(all(), "en"), /failures="1"/);
assert.ok(!toJunit(all(), "en").includes("<b>"), "xml escaped");
assert.match(toCsv(all(), "en"), /'=cmd/, "csv formula guarded");
assert.equal(all({ scope: "summary" }).scenarios.length, 0);
assert.equal(all({ scope: "failed" }).scenarios.length, 1);
assert.equal(all({ diagnostics: false }).bugs[0].console.length, 0);
assert.equal(all({ siteInfo: false }).run.url, undefined);
assert.ok(render(all(), { ...DEFAULT_OPTIONS, format: "html" }).text.includes("&lt;b&gt;"), "html escaped");
assert.equal(diffRuns(data, { ...data, scenarios: [{ ...data.scenarios[0], status: "failed" }, data.scenarios[1]], bugs: [] }).regressed.length, 1);
console.log("export selfcheck ok");
