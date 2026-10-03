"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-bold">
          {t("brand")}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href={pathname} locale={locale === "fa" ? "en" : "fa"}>
            {t("switchLocale")}
          </Link>
          {isAuthenticated && (
            <>
              <Link href="/dashboard">{t("dashboard")}</Link>
              <button onClick={() => void signOut()} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                {t("signOut")}
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
