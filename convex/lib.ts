import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export async function requireUser(ctx: QueryCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function requireOwnedRun(ctx: QueryCtx, runId: Id<"runs">) {
  const userId = await requireUser(ctx);
  const run = await ctx.db.get(runId);
  if (!run || run.userId !== userId) throw new Error("Run not found");
  return run;
}

export function checkSecret(secret: string) {
  const expected = process.env.WORKER_SECRET;
  if (!expected || secret !== expected) throw new Error("Unauthorized worker");
}

export const ACTIVE_STATUSES = ["planning", "running", "verifying", "reporting"] as const;

export const WORKER_ONLINE_MS = 45_000;
const SEEN_THROTTLE_MS = 15_000;

export async function markWorkerSeen(ctx: MutationCtx, workerId: string) {
  const now = Date.now();
  const row = await ctx.db
    .query("workers")
    .withIndex("by_worker", (q) => q.eq("workerId", workerId))
    .unique();
  if (!row) await ctx.db.insert("workers", { workerId, lastSeenAt: now });
  else if (row.lastSeenAt < now - SEEN_THROTTLE_MS) await ctx.db.patch(row._id, { lastSeenAt: now });
}

export async function lastWorkerSeen(ctx: QueryCtx) {
  const rows = await ctx.db.query("workers").collect();
  return rows.reduce((max, w) => Math.max(max, w.lastSeenAt), 0);
}
