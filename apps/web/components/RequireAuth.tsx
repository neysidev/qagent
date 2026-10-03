"use client";

import { useConvexAuth } from "convex/react";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/routing";
import { skeleton } from "./ui";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/signin");
  }, [isLoading, isAuthenticated, router]);

  if (!isAuthenticated) return <PageSkeleton />;
  return <>{children}</>;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8" aria-busy>
      <div className={`${skeleton} h-8 w-1/3`} />
      <div className={`${skeleton} h-32`} />
      <div className={`${skeleton} h-64`} />
    </div>
  );
}
