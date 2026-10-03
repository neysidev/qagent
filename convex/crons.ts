import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { ACTIVE_STATUSES } from "./lib";

const STALE_MS = 90_000;
const MAX_ATTEMPTS = 2;

export const reapStaleRuns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - STALE_MS;
    for (const status of ACTIVE_STATUSES) {
      const runs = await ctx.db
        .query("runs")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
      for (const run of runs) {
        if ((run.heartbeatAt ?? 0) > cutoff) continue;
        if ((run.attempts ?? 0) < MAX_ATTEMPTS) {
          await ctx.db.patch(run._id, { status: "queued", workerId: undefined, heartbeatAt: undefined });
        } else {
          await ctx.db.patch(run._id, { status: "failed", error: "Worker stopped responding", finishedAt: Date.now() });
        }
      }
    }
  },
});

const crons = cronJobs();
crons.interval("reap stale runs", { seconds: 30 }, internal.crons.reapStaleRuns);
export default crons;
