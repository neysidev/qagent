"use client";

import { useConvexAuth } from "convex/react";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogoBox } from "./brand/LogoBox";
import { skeleton } from "./ui";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/signin");
  }, [isLoading, isAuthenticated, router]);

  if (!isAuthenticated)
    return (
      <div className="grid h-dvh place-items-center bg-canvas" aria-busy>
        <LogoBox size={44} />
      </div>
    );
  return <>{children}</>;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 sm:px-6" aria-busy>
      <div className={`${skeleton} h-8 w-1/3`} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${skeleton} h-24`} />
        ))}
      </div>
      <div className={`${skeleton} h-72`} />
    </div>
  );
}
