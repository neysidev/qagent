import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { ACTIVE_STATUSES, lastWorkerSeen, WORKER_ONLINE_MS } from "./lib";

const STALE_MS = 90_000;
const MAX_ATTEMPTS = 2;
/** A queued run gives up after this long, but only while no worker is online (a busy queue still waits). */
const QUEUE_GIVE_UP_MS = 10 * 60_000;

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

    if ((await lastWorkerSeen(ctx)) > Date.now() - WORKER_ONLINE_MS) return;
    const stuck = await ctx.db
      .query("runs")
      .withIndex("by_status", (q) => q.eq("status", "queued"))
      .collect();
    for (const run of stuck) {
      if (run.createdAt > Date.now() - QUEUE_GIVE_UP_MS) continue;
      await ctx.db.patch(run._id, { status: "failed", error: "No worker available", finishedAt: Date.now() });
    }
  },
});

const crons = cronJobs();
crons.interval("reap stale runs", { seconds: 30 }, internal.crons.reapStaleRuns);
// Saturday morning (Tehran), the start of the Iranian week.
crons.weekly("weekly digest", { dayOfWeek: "saturday", hourUTC: 5, minuteUTC: 30 }, internal.email.weeklyDigest);
export default crons;
