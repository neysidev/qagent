import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { ACTIVE_STATUSES, requireOwnedRun, requireUser } from "./lib";

const DAY_MS = 24 * 60 * 60 * 1000;

type NewRun = Pick<Doc<"runs">, "url" | "goal" | "templateKey" | "locale" | "credentials">;

async function insertRun(ctx: MutationCtx, userId: Id<"users">, args: NewRun) {
  let parsed: URL;
  try {
    parsed = new URL(args.url.trim());
  } catch {
    throw new ConvexError("INVALID_URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new ConvexError("INVALID_URL");
  const goal = args.goal.trim();
  if (!goal || goal.length > 2000) throw new ConvexError("INVALID_GOAL");

  const now = Date.now();
  const limit = Number(process.env.DAILY_RUN_LIMIT ?? 10);
  const recent = await ctx.db
    .query("runs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(limit);
  if (recent.length >= limit && recent[limit - 1].createdAt > now - DAY_MS) throw new ConvexError("DAILY_LIMIT");

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
}

export const create = mutation({
  args: {
    url: v.string(),
    goal: v.string(),
    templateKey: v.optional(v.string()),
    locale: v.union(v.literal("fa"), v.literal("en")),
    credentials: v.optional(v.object({ username: v.string(), password: v.string() })),
  },
  handler: async (ctx, args) => insertRun(ctx, await requireUser(ctx), args),
});

export const rerun = mutation({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await requireOwnedRun(ctx, runId);
    return insertRun(ctx, run.userId, run);
  },
});

export const cancel = mutation({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await requireOwnedRun(ctx, runId);
    if (run.status !== "queued" && !(ACTIVE_STATUSES as readonly string[]).includes(run.status)) return;
    await ctx.db.patch(runId, { status: "canceled", finishedAt: Date.now() });
  },
});

export const share = mutation({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await requireOwnedRun(ctx, runId);
    if (run.shareToken) return run.shareToken;
    const shareToken = crypto.randomUUID().replaceAll("-", "");
    await ctx.db.patch(runId, { shareToken });
    return shareToken;
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

async function details(ctx: QueryCtx, { credentials: _c, userId: _u, ...run }: Doc<"runs">) {
  const [steps, scenarios, bugs] = await Promise.all([
    ctx.db
      .query("steps")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .collect(),
    ctx.db
      .query("scenarios")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .collect(),
    ctx.db
      .query("bugs")
      .withIndex("by_run", (q) => q.eq("runId", run._id))
      .collect(),
  ]);
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
        screenshotUrls: (await Promise.all(b.evidence.screenshotIds.map((id) => ctx.storage.getUrl(id)))).filter(
          (u): u is string => u !== null,
        ),
      })),
    ),
  };
}

export type RunDetails = Awaited<ReturnType<typeof details>>;

export const get = query({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => details(ctx, await requireOwnedRun(ctx, runId)),
});

export const getShared = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (token.length < 16) return null;
    const run = await ctx.db
      .query("runs")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", token))
      .unique();
    return run ? details(ctx, run) : null;
  },
});
