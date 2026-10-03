import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireOwnedRun, requireUser } from "./lib";

const DAY_MS = 24 * 60 * 60 * 1000;

export const create = mutation({
  args: {
    url: v.string(),
    goal: v.string(),
    templateKey: v.optional(v.string()),
    locale: v.union(v.literal("fa"), v.literal("en")),
    credentials: v.optional(v.object({ username: v.string(), password: v.string() })),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    let parsed: URL;
    try {
      parsed = new URL(args.url.trim());
    } catch {
      throw new Error("Invalid URL");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Only http(s) URLs are allowed");
    const goal = args.goal.trim();
    if (!goal || goal.length > 2000) throw new Error("Goal must be 1-2000 characters");

    const now = Date.now();
    const limit = Number(process.env.DAILY_RUN_LIMIT ?? 10);
    const recent = await ctx.db
      .query("runs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    if (recent.length >= limit && recent[limit - 1].createdAt > now - DAY_MS) {
      throw new Error("Daily run limit reached");
    }

    const baseUrl = parsed.origin;
    const existing = (
      await ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    ).find((p) => p.baseUrl === baseUrl);
    const projectId =
      existing?._id ?? (await ctx.db.insert("projects", { userId, name: parsed.host, baseUrl, createdAt: now }));

    return await ctx.db.insert("runs", {
      userId,
      projectId,
      url: parsed.href,
      goal,
      templateKey: args.templateKey,
      locale: args.locale,
      credentials: args.credentials,
      status: "queued",
      createdAt: now,
    });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const runs = await ctx.db
      .query("runs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    return runs.map(({ credentials: _c, ...r }) => r);
  },
});

export const get = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const { credentials: _c, ...run } = await requireOwnedRun(ctx, runId);
    const steps = await ctx.db
      .query("steps")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    const scenarios = await ctx.db
      .query("scenarios")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    const bugs = await ctx.db
      .query("bugs")
      .withIndex("by_run", (q) => q.eq("runId", runId))
      .collect();
    steps.sort((a, b) => a.createdAt - b.createdAt);
    return {
      run,
      scenarios,
      steps: await Promise.all(
        steps.map(async (s) => ({
          ...s,
          screenshotUrl: s.screenshotId ? await ctx.storage.getUrl(s.screenshotId) : null,
        })),
      ),
      bugs: await Promise.all(
        bugs.map(async (b) => ({
          ...b,
          screenshotUrls: await Promise.all(b.evidence.screenshotIds.map((id) => ctx.storage.getUrl(id))),
        })),
      ),
    };
  },
});
