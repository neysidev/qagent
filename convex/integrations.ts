import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalAction, internalQuery, mutation, query } from "./_generated/server";
import { requireUser } from "./lib";

const kind = v.union(v.literal("slack"), v.literal("telegram"), v.literal("webhook"));

/** Public https endpoints only; the host check is a basic guard, not a full SSRF defence. */
function validTarget(k: Doc<"integrations">["kind"], target: string, secret?: string) {
  if (k === "telegram") return /^-?\d{3,20}$/.test(target) && /^\d+:[\w-]{20,}$/.test(secret ?? "");
  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  if (k === "slack") return u.hostname === "hooks.slack.com";
  return !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/.test(u.hostname) && u.hostname.includes(".");
}

/** What the settings page shows: never the secret parts. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const rows = await ctx.db.query("integrations").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    return rows.map((r) => ({
      _id: r._id,
      kind: r.kind,
      onlyFailures: r.onlyFailures,
      label: r.kind === "telegram" ? r.target : new URL(r.target).host,
    }));
  },
});

export const add = mutation({
  args: { kind, target: v.string(), secret: v.optional(v.string()), onlyFailures: v.boolean() },
  handler: async (ctx, { kind, target, secret, onlyFailures }) => {
    const userId = await requireUser(ctx);
    target = target.trim();
    if (kind !== "telegram" && !/^[a-z][a-z\d+.-]*:\/\//i.test(target)) target = `https://${target}`;
    secret = secret?.trim() || undefined;
    if (!validTarget(kind, target, secret)) throw new ConvexError("INVALID_CHANNEL");
    const count = (await ctx.db.query("integrations").withIndex("by_user", (q) => q.eq("userId", userId)).collect()).length;
    if (count >= 10) throw new ConvexError("INVALID_CHANNEL");
    return ctx.db.insert("integrations", { userId, kind, target, secret, onlyFailures, createdAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("integrations") },
  handler: async (ctx, { id }) => {
    const row = await ctx.db.get(id);
    if (row && row.userId === (await requireUser(ctx))) await ctx.db.delete(id);
  },
});

const siteUrl = () => (process.env.SITE_URL ?? "").replace(/\/$/, "");

type Message = { text: string; payload: Record<string, unknown> };

export const loadMessage = internalQuery({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }): Promise<{ userId: Id<"users">; failed: boolean; message: Message } | null> => {
    const run = await ctx.db.get(runId);
    if (!run) return null;
    const bugs = await ctx.db.query("bugs").withIndex("by_run", (q) => q.eq("runId", runId)).collect();
    const failed = run.status === "failed" || bugs.length > 0 || (run.summary?.failed ?? 0) > 0;
    const link = `${siteUrl()}/runs/${runId}`;
    const s = run.summary;
    const head = run.status === "failed" ? "❌ تست ناموفق بود" : failed ? "⚠️ باگ پیدا شد" : "✅ همه چیز سالم است";
    const lines = [
      `${head} — ${new URL(run.url).host}`,
      run.goal.length > 140 ? `${run.goal.slice(0, 139)}…` : run.goal,
      ...(s ? [`${s.passed}/${s.total} سناریو موفق · ${bugs.length} باگ`] : []),
      ...bugs.slice(0, 5).map((b) => `• [${b.severity}] ${b.title}`),
      link,
    ];
    return {
      userId: run.userId,
      failed,
      message: {
        text: lines.join("\n"),
        payload: {
          event: "run.finished",
          run: { id: runId, url: run.url, goal: run.goal, status: run.status, summary: s ?? null, link },
          bugs: bugs.map((b) => ({ title: b.title, severity: b.severity })),
        },
      },
    };
  },
});

export const channelsOf = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => ctx.db.query("integrations").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
});

async function hmac(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Posts one message to one channel; returns whether the channel accepted it. */
async function deliver(c: Doc<"integrations">, m: Message): Promise<boolean> {
  try {
    let res: Response;
    if (c.kind === "slack") {
      res = await fetch(c.target, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: m.text }) });
    } else if (c.kind === "telegram") {
      res = await fetch(`https://api.telegram.org/bot${c.secret}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: c.target, text: m.text, disable_web_page_preview: true }),
      });
    } else {
      const body = JSON.stringify({ ...m.payload, text: m.text });
      res = await fetch(c.target, {
        method: "POST",
        headers: { "content-type": "application/json", ...(c.secret ? { "x-qagent-signature": await hmac(c.secret, body) } : {}) },
        body,
      });
    }
    return res.ok;
  } catch {
    return false;
  }
}

/** Runs after a run finishes: tells every channel that wants to know. */
export const notifyRun = internalAction({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const loaded = await ctx.runQuery(internal.integrations.loadMessage, { runId });
    if (!loaded) return;
    const channels = await ctx.runQuery(internal.integrations.channelsOf, { userId: loaded.userId });
    await Promise.all(channels.filter((c) => loaded.failed || !c.onlyFailures).map((c) => deliver(c, loaded.message)));
  },
});

/** Manual "send this report to my channels": ignores the failures-only filter and reports how many accepted. */
export const sendRun = action({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }): Promise<{ sent: number; total: number }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const loaded = await ctx.runQuery(internal.integrations.loadMessage, { runId });
    if (!loaded || loaded.userId !== userId) throw new Error("Run not found");
    const channels = await ctx.runQuery(internal.integrations.channelsOf, { userId });
    const results = await Promise.all(channels.map((c) => deliver(c, loaded.message)));
    return { sent: results.filter(Boolean).length, total: channels.length };
  },
});

/** "Send test" for one channel in settings. */
export const test = action({
  args: { id: v.id("integrations") },
  handler: async (ctx, { id }): Promise<boolean> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const channel = (await ctx.runQuery(internal.integrations.channelsOf, { userId })).find((c) => c._id === id);
    if (!channel) throw new Error("Channel not found");
    const text = "✅ اتصال کیوایجنت برقرار است";
    return deliver(channel, { text, payload: { event: "test" } });
  },
});
