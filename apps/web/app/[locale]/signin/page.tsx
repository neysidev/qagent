"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { button, card, input } from "@/components/ui";
import { useRouter } from "@/i18n/routing";

export default function SignIn() {
  const t = useTranslations("auth");
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
    <>
      <Header />
      <main className="mx-auto max-w-sm px-4 py-16">
        <div className={`${card} p-6`}>
          <h1 className="text-2xl font-semibold">{flow === "signIn" ? t("signInTitle") : t("signUpTitle")}</h1>
          {flow === "signUp" && <p className="mt-1 text-sm text-zinc-500">{t("signUpSubtitle")}</p>}
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <input type="hidden" name="flow" value={flow} />
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("email")}</span>
              <input name="email" type="email" required autoComplete="email" dir="ltr" className={input} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">{t("password")}</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                dir="ltr"
                className={input}
              />
              {flow === "signUp" && <span className="text-xs text-zinc-500">{t("passwordHint")}</span>}
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {flow === "signIn" ? t("errorSignIn") : t("errorSignUp")}
              </p>
            )}
            <button disabled={pending} className={`${button.primary} w-full`}>
              {pending && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
              {flow === "signIn" ? t("signIn") : t("signUp")}
            </button>
          </form>
          <button
            onClick={() => {
              setFlow(flow === "signIn" ? "signUp" : "signIn");
              setError(false);
            }}
            className="mt-4 text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            {flow === "signIn" ? t("toSignUp") : t("toSignIn")}
          </button>
        </div>
      </main>
    </>
  );
}
