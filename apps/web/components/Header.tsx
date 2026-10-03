"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { ThemeToggle } from "./ThemeToggle";
import { button } from "./ui";

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <header className="no-print sticky top-0 z-20 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold">
          <span className="grid size-7 place-items-center rounded-lg bg-blue-600 text-sm text-white">Q</span>
          {t("brand")}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href={pathname} locale={locale === "fa" ? "en" : "fa"} className={button.ghost}>
            {t("switchLocale")}
          </Link>
          <ThemeToggle />
          {!isLoading &&
            (isAuthenticated ? (
              <>
                <Link href="/dashboard" className={`${button.ghost} max-sm:hidden`}>
                  {t("dashboard")}
                </Link>
                <button onClick={() => void signOut()} className={button.ghost}>
                  {t("signOut")}
                </button>
              </>
            ) : (
              <Link href="/signin" className={button.ghost}>
                {t("signIn")}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
