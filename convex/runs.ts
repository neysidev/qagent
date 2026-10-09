import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { ACTIVE_STATUSES, lastWorkerSeen, requireOwnedRun, requireUser, WORKER_ONLINE_MS } from "./lib";

const DAY_MS = 24 * 60 * 60 * 1000;

type NewRun = Pick<Doc<"runs">, "url" | "goal" | "templateKey" | "credentials" | "replayOf">;

const dailyLimit = () => Number(process.env.DAILY_RUN_LIMIT ?? 10);

/** A site address as typed by a person: scheme optional, http(s) only. */
function parseSiteUrl(raw: string): URL {
  const trimmed = raw.trim();
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new ConvexError("INVALID_URL");
  }
  // Reachability and the private-network guard are the worker's job (security.py); this only checks the shape.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new ConvexError("INVALID_URL");
  return parsed;
}

/** One project per site origin per user: returns the existing one or creates it. */
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

/** Core entry point: an address in, the site's project out (found by origin, created on first visit). */
export const openProject = mutation({
  args: { url: v.string() },
  handler: async (ctx, { url }) => ensureProject(ctx, await requireUser(ctx), parseSiteUrl(url)),
});

export const rerun = mutation({
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await requireOwnedRun(ctx, runId);
    // Passed scenarios are replayed deterministically (no LLM); the rest re-run with the agent.
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
  args: { runId: v.id("runs") },
  handler: async (ctx, { runId }) => {
    const run = await requireOwnedRun(ctx, runId);
    if (run.shareToken) return run.shareToken;
    const shareToken = crypto.randomUUID().replaceAll("-", "");
    await ctx.db.patch(runId, { shareToken });
    return shareToken;
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

/** Newest first. ponytail: collects all runs of a project; paginate once a project passes a few hundred runs. */
const projectRuns = (ctx: QueryCtx, projectId: Id<"projects">) =>
  ctx.db
    .query("runs")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .order("desc")
    .collect();

/** Projects with what a picker needs: run count and the latest run, most recently active first. */
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

/** Everything the project page shows: its runs, aggregate results and the bugs found recently. */
export const projectOverview = query({
  // A plain string: the id comes from the URL, and a malformed one should read as "not found", not throw.
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

/**
 * When a worker last checked in. Queries re-run when data changes, not as time passes, so the client compares
 * `lastSeenAt + onlineMs` with its own clock to notice a worker going quiet.
 */
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
    return user && { email: user.email ?? "", plan: user.plan ?? "free" };
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

/** Re-reads the site's title and favicon (a custom name is kept). */
export const refreshProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const { baseUrl } = await requireOwnedProject(ctx, projectId);
    await ctx.scheduler.runAfter(0, internal.siteMeta.fetchSiteMeta, { projectId, baseUrl });
  },
});

/** Deletes a project with all its runs, scenarios, steps, bugs and screenshots. */
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await requireOwnedProject(ctx, projectId);
    // ponytail: one transaction for the whole project; batch via scheduler if projects grow past a few hundred runs.
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
