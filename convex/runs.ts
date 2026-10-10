import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { ACTIVE_STATUSES, lastWorkerSeen, requireOwnedRun, requireUser, WORKER_ONLINE_MS } from "./lib";

const DAY_MS = 24 * 60 * 60 * 1000;

type NewRun = Pick<Doc<"runs">, "url" | "goal" | "templateKey" | "credentials" | "replayOf">;

const dailyLimit = () => Number(process.env.DAILY_RUN_LIMIT ?? 10);

function parseSiteUrl(raw: string): URL {
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new ConvexError("INVALID_URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new ConvexError("INVALID_URL");
  return parsed;
}

async function ensureProject(ctx: MutationCtx, userId: Id<"users">, parsed: URL) {
  const baseUrl = parsed.origin;
  const existing = (
    await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect()
  ).find((p) => p.baseUrl === baseUrl);
  if (existing) return existing._id;
  const projectId = await ctx.db.insert("projects", { userId, name: parsed.host, baseUrl, createdAt: Date.now() });
  await ctx.scheduler.runAfter(0, internal.siteMeta.fetchSiteMeta, { projectId, baseUrl });
  return projectId;
}

async function insertRun(ctx: MutationCtx, userId: Id<"users">, args: NewRun) {
  const parsed = parseSiteUrl(args.url);
  const goal = args.goal.trim();
  if (!goal || goal.length > 2000) throw new ConvexError("INVALID_GOAL");

  const now = Date.now();
  const limit = dailyLimit();
  const recent = await ctx.db
    .query("runs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(limit);
  if (recent.length >= limit && recent[limit - 1].createdAt > now - DAY_MS) throw new ConvexError("DAILY_LIMIT");

  const projectId = await ensureProject(ctx, userId, parsed);

  return await ctx.db.insert("runs", {
    userId,
    projectId,
    url: parsed.href,
    goal,
    templateKey: args.templateKey,
    credentials: args.credentials,
    replayOf: args.replayOf,
    status: "queued",
    createdAt: now,
  });
}

export const create = mutation({
  args: {
    url: v.string(),
    goal: v.string(),
    templateKey: v.optional(v.string()),
    credentials: v.optional(v.object({ username: v.string(), password: v.string() })),
  },
  handler: async (ctx, args) => insertRun(ctx, await requireUser(ctx), args),
});

export const openProject = mutation({
  args: { url: v.string() },
  handler: async (ctx, { url }) => ensureProject(ctx, await requireUser(ctx), parseSiteUrl(url)),
});

export const rerun = mutation({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await requireOwnedRun(ctx, runId);
    return insertRun(ctx, run.userId, { ...run, replayOf: run._id });
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
  args: { runId: v.id("runs"), expiresInDays: v.optional(v.number()) },
  handler: async (ctx, { runId, expiresInDays }) => {
    const run = await requireOwnedRun(ctx, runId);
    return ensureShare(ctx, run, expiresInDays);
  },
});

export async function ensureShare(ctx: MutationCtx, run: Doc<"runs">, expiresInDays?: number) {
  const shareToken = run.shareToken ?? crypto.randomUUID().replaceAll("-", "");
  const shareExpiresAt = expiresInDays && expiresInDays > 0 ? Date.now() + expiresInDays * DAY_MS : undefined;
  await ctx.db.patch(run._id, { shareToken, shareExpiresAt });
  return shareToken;
}

export const unshare = mutation({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    await requireOwnedRun(ctx, runId);
    await ctx.db.patch(runId, { shareToken: undefined, shareExpiresAt: undefined });
  },
});

export const quota = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const limit = dailyLimit();
    const recent = await ctx.db
      .query("runs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    const since = Date.now() - DAY_MS;
    return { used: recent.filter((r) => r.createdAt > since).length, limit };
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

export const liveTarget = internalQuery({
  args: { runId: v.id("runs"), userId: v.id("users") },
  handler: async (ctx, { runId, userId }) => {
    const run = await ctx.db.get(runId);
    if (!run || run.userId !== userId || !(ACTIVE_STATUSES as readonly string[]).includes(run.status)) return null;
    return run.liveUrl ?? null;
  },
});

export const liveAccess = action({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }): Promise<string | null> => {
    const userId = await getAuthUserId(ctx);
    const secret = process.env.WORKER_SECRET;
    if (!userId || !secret) return null;
    const base = await ctx.runQuery(internal.runs.liveTarget, { runId, userId });
    if (!base) return null;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(runId)));
    const token = Array.from(mac, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
    return `${base}/live/${runId}?token=${token}`;
  },
});

export const getShared = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (token.length < 16) return null;
    const run = await ctx.db
      .query("runs")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", token))
      .unique();
    if (!run || (run.shareExpiresAt && run.shareExpiresAt < Date.now())) return null;
    const owner = await ctx.db.get(run.userId);
    return { ...(await details(ctx, run)), brand: owner?.brand ?? null };
  },
});

type RunSummary = Pick<Doc<"runs">, "_id" | "goal" | "url" | "status" | "createdAt" | "finishedAt" | "summary" | "templateKey" | "replayOf">;
const summarize = (r: Doc<"runs">): RunSummary => ({
  _id: r._id,
  goal: r.goal,
  url: r.url,
  status: r.status,
  createdAt: r.createdAt,
  finishedAt: r.finishedAt,
  summary: r.summary,
  templateKey: r.templateKey,
  replayOf: r.replayOf,
});

const projectRuns = (ctx: QueryCtx, projectId: Id<"projects">) =>
  ctx.db
    .query("runs")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .order("desc")
    .collect();

export const projectList = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const rows = await Promise.all(
      projects.map(async (p) => {
        const runs = await projectRuns(ctx, p._id);
        const last = runs[0];
        return { ...p, runCount: runs.length, lastRun: last ? summarize(last) : null, lastActiveAt: last?.createdAt ?? p.createdAt };
      }),
    );
    return rows.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  },
});

export const projectOverview = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const projectId = ctx.db.normalizeId("projects", args.projectId);
    const project = projectId && (await ctx.db.get(projectId));
    if (!projectId || !project || project.userId !== userId) return null;
    const runs = await projectRuns(ctx, projectId);
    const finished = runs.filter((r) => r.summary);
    const totals = finished.reduce(
      (t, r) => ({ scenarios: t.scenarios + r.summary!.total, passed: t.passed + r.summary!.passed, bugs: t.bugs + r.summary!.bugs }),
      { scenarios: 0, passed: 0, bugs: 0 },
    );
    const withBugs = finished.filter((r) => r.summary!.bugs > 0).slice(0, 5);
    const recentBugs = (
      await Promise.all(
        withBugs.map(async (r) =>
          (await ctx.db.query("bugs").withIndex("by_run", (q) => q.eq("runId", r._id)).collect()).map((b) => ({
            _id: b._id,
            runId: r._id,
            title: b.title,
            severity: b.severity,
            foundAt: r.finishedAt ?? r.createdAt,
          })),
        ),
      )
    )
      .flat()
      .slice(0, 8);
    return { project, runs: runs.map(summarize), totals: { runs: runs.length, ...totals }, recentBugs };
  },
});

export const workerStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return { lastSeenAt: await lastWorkerSeen(ctx), onlineMs: WORKER_ONLINE_MS };
  },
});

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.get(await requireUser(ctx));
    return user && { email: user.email ?? "", plan: user.plan ?? "free", weeklyDigest: user.weeklyDigest ?? false, brand: user.brand ?? null };
  },
});

export const setWeeklyDigest = mutation({
  args: { on: v.boolean() },
  handler: async (ctx, { on }) => ctx.db.patch(await requireUser(ctx), { weeklyDigest: on }),
});

export const setBrand = mutation({
  args: { brand: v.union(v.null(), v.object({ name: v.string(), logo: v.optional(v.string()) })) },
  handler: async (ctx, { brand }) => {
    const userId = await requireUser(ctx);
    if (brand && (!brand.name.trim() || brand.name.length > 60 || (brand.logo && (brand.logo.length > 200_000 || !brand.logo.startsWith("data:image/")))))
      throw new ConvexError("INVALID_BRAND");
    await ctx.db.patch(userId, { brand: brand ? { name: brand.name.trim(), logo: brand.logo } : undefined });
  },
});

async function requireOwnedProject(ctx: QueryCtx, projectId: Id<"projects">) {
  const userId = await requireUser(ctx);
  const project = await ctx.db.get(projectId);
  if (!project || project.userId !== userId) throw new Error("Project not found");
  return project;
}

export const renameProject = mutation({
  args: { projectId: v.id("projects"), name: v.string() },
  handler: async (ctx, { projectId, name }) => {
    await requireOwnedProject(ctx, projectId);
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80) throw new ConvexError("INVALID_NAME");
    await ctx.db.patch(projectId, { name: trimmed });
  },
});

export const setTracker = mutation({
  args: {
    projectId: v.id("projects"),
    tracker: v.union(
      v.null(),
      v.object({ kind: v.union(v.literal("github"), v.literal("linear"), v.literal("jira")), target: v.string(), projectId: v.optional(v.string()) }),
    ),
  },
  handler: async (ctx, { projectId, tracker }) => {
    await requireOwnedProject(ctx, projectId);
    if (tracker) {
      const t = tracker.target.trim();
      const ok =
        tracker.kind === "github" ? /^[\w.-]+\/[\w.-]+$/.test(t) : tracker.kind === "linear" ? /^[A-Za-z0-9]{1,10}$/.test(t) : /^[\w.-]+\.atlassian\.net$/.test(t) && /^\d+$/.test(tracker.projectId ?? "");
      if (!ok) throw new ConvexError("INVALID_TRACKER");
      tracker = { ...tracker, target: t };
    }
    await ctx.db.patch(projectId, { tracker: tracker ?? undefined });
  },
});

export const refreshProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const { baseUrl } = await requireOwnedProject(ctx, projectId);
    await ctx.scheduler.runAfter(0, internal.siteMeta.fetchSiteMeta, { projectId, baseUrl });
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await requireOwnedProject(ctx, projectId);
    const runs = await projectRuns(ctx, project._id);
    if (runs.some((r) => r.status === "queued" || (ACTIVE_STATUSES as readonly string[]).includes(r.status)))
      throw new ConvexError("PROJECT_BUSY");

    for (const run of runs) {
      const [scenarios, steps, bugs] = await Promise.all([
        ctx.db.query("scenarios").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
        ctx.db.query("steps").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
        ctx.db.query("bugs").withIndex("by_run", (q) => q.eq("runId", run._id)).collect(),
      ]);
      const files = new Set([
        ...steps.flatMap((s) => (s.screenshotId ? [s.screenshotId] : [])),
        ...bugs.flatMap((b) => b.evidence.screenshotIds),
      ]);
      await Promise.all([
        ...[...files].map((id) => ctx.storage.delete(id)),
        ...[...scenarios, ...steps, ...bugs].map((d) => ctx.db.delete(d._id)),
      ]);
      await ctx.db.delete(run._id);
    }
    await ctx.db.delete(projectId);
  },
});
