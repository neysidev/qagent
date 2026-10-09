import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { ensureShare } from "./runs";

const siteUrl = () => (process.env.SITE_URL ?? "").replace(/\/$/, "");
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sends through Resend. Needs RESEND_API_KEY and EMAIL_FROM on the Convex deployment. */
async function sendEmail(to: string[], subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new ConvexError("EMAIL_NOT_CONFIGURED");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) throw new ConvexError("EMAIL_FAILED");
}

const layout = (title: string, body: string, cta?: { href: string; label: string }) => `<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><style>@font-face{font-family:Peyda;font-weight:400;src:url(${siteUrl()}/fonts/peyda-regular.woff2) format("woff2")}@font-face{font-family:Peyda;font-weight:700;src:url(${siteUrl()}/fonts/peyda-bold.woff2) format("woff2")}</style></head><body style="margin:0;background:#f6f5f2;font-family:Peyda,system-ui,'Segoe UI',sans-serif;color:#1c1b1a">
<div style="max-width:560px;margin:0 auto;padding:24px 16px"><div style="background:#fff;border:1px solid #e6e3dc;border-radius:14px;padding:24px">
<h1 style="font-size:18px;margin:0 0 12px">${esc(title)}</h1>${body}
${cta ? `<p style="margin:20px 0 0"><a href="${esc(cta.href)}" style="display:inline-block;background:#f26a1b;color:#fff;text-decoration:none;border-radius:999px;padding:10px 20px;font-size:14px">${esc(cta.label)}</a></p>` : ""}
</div><p style="color:#8a867d;font-size:12px;text-align:center">کیوایجنت</p></div></body></html>`;

/** Verifies ownership, makes sure a 30 day public link exists and returns what the email needs. */
export const prepare = internalMutation({
  args: { userId: v.id("users"), runId: v.id("runs") },
  handler: async (ctx, { userId, runId }) => {
    const run = await ctx.db.get(runId);
    if (!run || run.userId !== userId) throw new Error("Run not found");
    // An existing link keeps its own expiry; only a new one gets the 30 day default.
    const token = run.shareToken ?? (await ensureShare(ctx, run, 30));
    const bugs = await ctx.db.query("bugs").withIndex("by_run", (q) => q.eq("runId", runId)).collect();
    const owner = await ctx.db.get(userId);
    return { run, token, bugs: bugs.map((b) => ({ title: b.title, severity: b.severity })), brand: owner?.brand?.name ?? null };
  },
});

export const sendReport = action({
  args: { runId: v.id("runs"), to: v.array(v.string()) },
  handler: async (ctx, { runId, to }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const list = [...new Set(to.map((e) => e.trim().toLowerCase()).filter(Boolean))];
    if (!list.length || list.length > 10 || !list.every((e) => EMAIL.test(e))) throw new ConvexError("INVALID_EMAIL");
    const { run, token, bugs, brand } = await ctx.runMutation(internal.email.prepare, { userId, runId });
    const s = run.summary;
    const rows = bugs.map((b) => `<li style="margin:4px 0">[${esc(b.severity)}] ${esc(b.title)}</li>`).join("");
    const html = layout(
      `گزارش تست ${new URL(run.url).host}`,
      `<p style="margin:0 0 8px;color:#55524b;line-height:1.9">${esc(run.goal)}</p>
       ${s ? `<p style="margin:0 0 8px">${s.passed} از ${s.total} سناریو موفق، ${bugs.length} باگ</p>` : ""}
       ${rows ? `<ul style="padding-inline-start:20px;margin:0">${rows}</ul>` : ""}`,
      { href: `${siteUrl()}/share/${token}`, label: "دیدن گزارش کامل" },
    );
    await sendEmail(list, `${brand ?? "کیوایجنت"} | گزارش تست ${new URL(run.url).host}`, html);
    return list.length;
  },
});

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** One entry per opted-in user: their projects' runs from the last week. ponytail: scans all users; index digest opt-ins once there are thousands. */
export const digestData = internalQuery({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - WEEK_MS;
    const users = (await ctx.db.query("users").collect()).filter((u) => u.weeklyDigest && u.email);
    return Promise.all(
      users.map(async (u) => {
        const projects = await ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", u._id)).collect();
        const rows = (
          await Promise.all(
            projects.map(async (p) => {
              const runs = (await ctx.db.query("runs").withIndex("by_project", (q) => q.eq("projectId", p._id)).order("desc").take(100)).filter(
                (r) => r.createdAt > since && r.summary,
              );
              if (!runs.length) return null;
              const t = runs.reduce((a, r) => ({ total: a.total + r.summary!.total, passed: a.passed + r.summary!.passed, bugs: a.bugs + r.summary!.bugs }), {
                total: 0,
                passed: 0,
                bugs: 0,
              });
              return { id: p._id as Id<"projects">, name: p.name, runs: runs.length, ...t };
            }),
          )
        ).filter((r): r is NonNullable<typeof r> => r !== null);
        return { email: u.email!, rows };
      }),
    );
  },
});

/** Weekly cron: one email per opted-in user who ran something this week. */
export const weeklyDigest = internalAction({
  args: {},
  handler: async (ctx) => {
    for (const { email, rows } of await ctx.runQuery(internal.email.digestData, {})) {
      if (!rows.length) continue;
      const body = rows
        .map(
          (r) => `<p style="margin:0 0 10px"><b>${esc(r.name)}</b><br><span style="color:#55524b">${r.runs} تست، ${r.passed} از ${r.total} سناریو موفق، ${r.bugs} باگ</span></p>`,
        )
        .join("");
      try {
        await sendEmail([email], "خلاصه هفتگی کیوایجنت", layout("خلاصه این هفته", body, { href: `${siteUrl()}/dashboard`, label: "باز کردن پروژه‌ها" }));
      } catch {
        // One bad address or provider hiccup must not stop the other users' digests.
      }
    }
  },
});
