import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const runStatus = v.union(
  v.literal("queued"),
  v.literal("planning"),
  v.literal("running"),
  v.literal("verifying"),
  v.literal("reporting"),
  v.literal("done"),
  v.literal("failed"),
  v.literal("canceled"),
);

export const scenarioStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("passed"),
  v.literal("failed"),
  v.literal("error"),
  v.literal("skipped"),
);

export const scenarioKind = v.union(v.literal("happy"), v.literal("negative"), v.literal("edge"));
export const severity = v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low"));
export const bbox = v.object({ x: v.number(), y: v.number(), w: v.number(), h: v.number() });
export const action = v.object({
  type: v.string(),
  ref: v.optional(v.string()),
  value: v.optional(v.string()),
  url: v.optional(v.string()),
  key: v.optional(v.string()),
});

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    locale: v.optional(v.union(v.literal("fa"), v.literal("en"))),
    plan: v.optional(v.string()),
  }).index("email", ["email"]),

  projects: defineTable({
    userId: v.id("users"),
    name: v.string(),
    baseUrl: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  runs: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    url: v.string(),
    goal: v.string(),
    templateKey: v.optional(v.string()),
    locale: v.union(v.literal("fa"), v.literal("en")),
    credentials: v.optional(v.object({ username: v.string(), password: v.string() })),
    status: runStatus,
    workerId: v.optional(v.string()),
    heartbeatAt: v.optional(v.number()),
    attempts: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    summary: v.optional(v.object({ total: v.number(), passed: v.number(), failed: v.number(), bugs: v.number() })),
    cost: v.optional(
      v.object({ inputTokens: v.number(), outputTokens: v.number(), usd: v.number(), llmCalls: v.number() }),
    ),
    error: v.optional(v.string()),
    shareToken: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_shareToken", ["shareToken"]),

  scenarios: defineTable({
    runId: v.id("runs"),
    index: v.number(),
    title: v.string(),
    description: v.string(),
    kind: scenarioKind,
    expected: v.string(),
    status: scenarioStatus,
    verdictReason: v.optional(v.string()),
  }).index("by_run", ["runId", "index"]),

  steps: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_run", ["runId", "index"])
    .index("by_scenario", ["scenarioId", "index"]),

  bugs: defineTable({
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
  }).index("by_run", ["runId"]),
});
