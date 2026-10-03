import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { action, bbox, runStatus, scenarioKind, scenarioStatus, severity } from "./schema";
import { checkSecret } from "./lib";

const secret = v.string();

export const claimNextRun = mutation({
  args: { secret, workerId: v.string() },
  handler: async (ctx, { secret, workerId }) => {
    checkSecret(secret);
    const run = await ctx.db
      .query("runs")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .order("asc")
      .first();
    if (!run) return null;
    const now = Date.now();
    await ctx.db.patch(run._id, {
      status: "planning",
      workerId,
      heartbeatAt: now,
      startedAt: now,
      attempts: (run.attempts ?? 0) + 1,
    });
    return { ...run, status: "planning" as const };
  },
});

export const heartbeat = mutation({
  args: { secret, runId: v.id("runs"), workerId: v.string() },
  handler: async (ctx, { secret, runId, workerId }) => {
    checkSecret(secret);
    const run = await ctx.db.get(runId);
    // Tell the worker to stop if the run was canceled or handed to someone else.
    if (!run || run.workerId !== workerId) return { stop: true };
    if (run.status === "canceled" || run.status === "failed" || run.status === "done") return { stop: true };
    await ctx.db.patch(runId, { heartbeatAt: Date.now() });
    return { stop: false };
  },
});

export const setRunStatus = mutation({
  args: { secret, runId: v.id("runs"), status: runStatus, error: v.optional(v.string()) },
  handler: async (ctx, { secret, runId, status, error }) => {
    checkSecret(secret);
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
  },
  handler: async (ctx, { secret, scenarioId, status, verdictReason }) => {
    checkSecret(secret);
    await ctx.db.patch(scenarioId, { status, verdictReason });
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
    return await ctx.db.insert("steps", { ...step, createdAt: Date.now() });
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
    summary: v.optional(v.object({ total: v.number(), passed: v.number(), failed: v.number(), bugs: v.number() })),
    cost: v.optional(
      v.object({ inputTokens: v.number(), outputTokens: v.number(), usd: v.number(), llmCalls: v.number() }),
    ),
  },
  handler: async (ctx, { secret, runId, ...rest }) => {
    checkSecret(secret);
    const run = await ctx.db.get(runId);
    if (!run || run.status === "canceled") return;
    await ctx.db.patch(runId, { ...rest, finishedAt: Date.now() });
  },
});

export const generateUploadUrl = mutation({
  args: { secret },
  handler: async (ctx, { secret }) => {
    checkSecret(secret);
    return await ctx.storage.generateUploadUrl();
  },
});
