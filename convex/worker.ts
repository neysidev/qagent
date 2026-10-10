import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";
import { action, bbox, cost, runStatus, scenarioKind, scenarioStatus, severity, trace } from "./schema";
import { checkSecret, markWorkerSeen } from "./lib";

const secret = v.string();

export const claimNextRun = mutation({
  args: { secret, workerId: v.string(), liveUrl: v.optional(v.string()) },
  handler: async (ctx, { secret, workerId, liveUrl }) => {
    checkSecret(secret);
    await markWorkerSeen(ctx, workerId);
    const run = await ctx.db
      .query("runs")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .order("asc")
      .first();
    if (!run) return null;
    if (run.attempts) {
      for (const table of ["steps", "scenarios", "bugs"] as const) {
        const docs = await ctx.db
          .query(table)
          .withIndex("by_run", (q) => q.eq("runId", run._id))
          .collect();
        for (const doc of docs) await ctx.db.delete(doc._id);
      }
    }
    const now = Date.now();
    await ctx.db.patch(run._id, {
      status: "planning",
      workerId,
      liveUrl,
      heartbeatAt: now,
      startedAt: now,
      attempts: (run.attempts ?? 0) + 1,
    });
    return { ...run, status: "planning" as const };
  },
});

export const heartbeat = mutation({
  args: { secret, runId: v.id("runs"), workerId: v.string(), cost: v.optional(cost) },
  handler: async (ctx, { secret, runId, workerId, cost }) => {
    checkSecret(secret);
    await markWorkerSeen(ctx, workerId);
    const run = await ctx.db.get(runId);
    if (!run || run.workerId !== workerId) return { stop: true };
    if (run.status === "canceled" || run.status === "failed" || run.status === "done") return { stop: true };
    await ctx.db.patch(runId, { heartbeatAt: Date.now(), ...(cost && { cost }) });
    return { stop: false };
  },
});

export const setRunStatus = mutation({
  args: { secret, runId: v.id("runs"), status: runStatus, error: v.optional(v.string()) },
  handler: async (ctx, { secret, runId, status, error }) => {
    checkSecret(secret);
    const run = await ctx.db.get(runId);
    if (!run || run.status === "canceled") return;
    await ctx.db.patch(runId, { status, error, heartbeatAt: Date.now() });
  },
});

export const createScenarios = mutation({
  args: {
    secret,
    runId: v.id("runs"),
    scenarios: v.array(
      v.object({ title: v.string(), description: v.string(), kind: scenarioKind, expected: v.string() }),
    ),
  },
  handler: async (ctx, { secret, runId, scenarios }) => {
    checkSecret(secret);
    return await Promise.all(
      scenarios.map((s, index) => ctx.db.insert("scenarios", { ...s, runId, index, status: "pending" })),
    );
  },
});

export const updateScenario = mutation({
  args: {
    secret,
    scenarioId: v.id("scenarios"),
    status: scenarioStatus,
    verdictReason: v.optional(v.string()),
    replayed: v.optional(v.boolean()),
    trace: v.optional(trace),
  },
  handler: async (ctx, { secret, scenarioId, ...patch }) => {
    checkSecret(secret);
    await ctx.db.patch(scenarioId, patch);
  },
});

export const getReplay = mutation({
  args: { secret, runId: v.id("runs") },
  handler: async (ctx, { secret, runId }) => {
    checkSecret(secret);
    const run = await ctx.db.get(runId);
    if (!run?.replayOf) return [];
    const scenarios = await ctx.db
      .query("scenarios")
      .withIndex("by_run", (q) => q.eq("runId", run.replayOf!))
      .collect();
    return scenarios.map(({ title, description, kind, expected, status, trace }) => ({
      title,
      description,
      kind,
      expected,
      trace: status === "passed" ? trace : undefined,
    }));
  },
});

export const addStep = mutation({
  args: {
    secret,
    runId: v.id("runs"),
    scenarioId: v.id("scenarios"),
    index: v.number(),
    action,
    thought: v.string(),
    target: v.optional(bbox),
    viewport: v.object({ w: v.number(), h: v.number() }),
    pageUrl: v.string(),
    screenshotId: v.optional(v.id("_storage")),
    ok: v.boolean(),
    error: v.optional(v.string()),
    durationMs: v.number(),
  },
  handler: async (ctx, { secret, ...step }) => {
    checkSecret(secret);
    await ctx.db.insert("steps", { ...step, createdAt: Date.now() });
    const run = await ctx.db.get(step.runId);
    return { stop: !run || run.status === "canceled" };
  },
});

export const addBug = mutation({
  args: {
    secret,
    runId: v.id("runs"),
    scenarioId: v.id("scenarios"),
    title: v.string(),
    severity,
    reproSteps: v.array(v.string()),
    expected: v.string(),
    actual: v.string(),
    evidence: v.object({
      screenshotIds: v.array(v.id("_storage")),
      consoleErrors: v.array(v.string()),
      networkErrors: v.array(v.object({ method: v.string(), url: v.string(), status: v.number() })),
    }),
  },
  handler: async (ctx, { secret, ...bug }) => {
    checkSecret(secret);
    return await ctx.db.insert("bugs", bug);
  },
});

export const finishRun = mutation({
  args: {
    secret,
    runId: v.id("runs"),
    status: v.union(v.literal("done"), v.literal("failed")),
    error: v.optional(v.string()),
    summaryText: v.optional(v.string()),
    summary: v.optional(v.object({ total: v.number(), passed: v.number(), failed: v.number(), bugs: v.number() })),
    cost: v.optional(cost),
  },
  handler: async (ctx, { secret, runId, ...rest }) => {
    checkSecret(secret);
    const run = await ctx.db.get(runId);
    if (!run || run.status === "canceled") return;
    await ctx.db.patch(runId, { ...rest, finishedAt: Date.now() });
    await ctx.scheduler.runAfter(0, internal.integrations.notifyRun, { runId });
  },
});

export const generateUploadUrl = mutation({
  args: { secret },
  handler: async (ctx, { secret }) => {
    checkSecret(secret);
    return await ctx.storage.generateUploadUrl();
  },
});
