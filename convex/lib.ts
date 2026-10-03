import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx } from "./_generated/server";
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
