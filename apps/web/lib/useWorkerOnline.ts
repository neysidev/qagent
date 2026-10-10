"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";

export function useWorkerOnline(): boolean | undefined {
  const status = useQuery(api.runs.workerStatus);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);
  return status && status.lastSeenAt + status.onlineMs > now;
}
