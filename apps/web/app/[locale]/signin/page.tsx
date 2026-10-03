"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
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
    } finally {
      setPending(false);
    }
  }

  const input =
    "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700 focus:outline-2 focus:outline-blue-500";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-sm px-4 py-16">
        <h1 className="mb-6 text-2xl font-bold">{flow === "signIn" ? t("signInTitle") : t("signUpTitle")}</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="flow" value={flow} />
          <label className="block space-y-1">
            <span className="text-sm">{t("email")}</span>
            <input name="email" type="email" required autoComplete="email" dir="ltr" className={input} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm">{t("password")}</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={flow === "signIn" ? "current-password" : "new-password"}
              dir="ltr"
              className={input}
            />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{t("error")}</p>}
          <button
            disabled={pending}
            className="w-full rounded-lg bg-zinc-900 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            {flow === "signIn" ? t("signIn") : t("signUp")}
          </button>
        </form>
        <button
          onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          className="mt-4 text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          {flow === "signIn" ? t("toSignUp") : t("toSignIn")}
        </button>
      </main>
    </>
  );
}
