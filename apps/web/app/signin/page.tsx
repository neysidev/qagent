"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoBox } from "@/components/brand/LogoBox";
import { PixelGrid } from "@/components/brand/PixelGrid";
import { button, card, input, label, segment, segmented } from "@/components/ui";

export default function SignIn() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signUp");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(false);
    setPending(true);
    try {
      await signIn("password", new FormData(e.currentTarget));
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-canvas px-4 py-16">
      <PixelGrid cols={80} rows={50} cell={10} gap={6} density={0.015} twinkle={0.03} className="absolute inset-0 size-full opacity-50" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="group mx-auto mb-6 flex w-fit items-center gap-2 font-semibold">
          <LogoBox size={32} /> {tc("brand")}
        </Link>
        <div className={`${card} p-6 shadow-2xl shadow-black/40`}>
          <div className={`${segmented} mb-6 grid w-full grid-cols-2`} role="group">
            {(["signUp", "signIn"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={flow === f}
                onClick={() => {
                  setFlow(f);
                  setError(false);
                }}
                className={segment}
              >
                {t(f)}
              </button>
            ))}
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{flow === "signIn" ? t("signInTitle") : t("signUpTitle")}</h1>
          {flow === "signUp" && <p className="mt-1 text-sm text-fg-3">{t("signUpSubtitle")}</p>}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input type="hidden" name="flow" value={flow} />
            <label className="block space-y-1.5">
              <span className={label}>{t("email")}</span>
              <input name="email" type="email" required autoComplete="email" dir="ltr" aria-invalid={error || undefined} className={input} />
            </label>
            <label className="block space-y-1.5">
              <span className={label}>{t("password")}</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                dir="ltr"
                aria-invalid={error || undefined}
                className={input}
              />
              {flow === "signUp" && <span className="text-xs text-fg-3">{t("passwordHint")}</span>}
            </label>
            {error && (
              <p role="alert" className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
                {flow === "signIn" ? t("errorSignIn") : t("errorSignUp")}
              </p>
            )}
            <button disabled={pending} className={`${button.primary} h-10 w-full`}>
              {pending && <span className="size-3.5 animate-spin rounded-full border-2 border-on-accent/30 border-t-on-accent" aria-hidden />}
              {flow === "signIn" ? t("signIn") : t("signUp")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
