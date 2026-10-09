"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { ArrowLeft, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoBox } from "@/components/brand/LogoBox";
import agent from "@/public/hero-agent.webp";

const field =
  "h-12 w-full rounded-xl border border-line-strong bg-card px-4 text-[15px] text-fg transition-[border-color,box-shadow] duration-150 placeholder:text-fg-3 focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)] focus:outline-none aria-invalid:border-danger";

export default function SignIn() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [flow, setFlow] = useState<"signUp" | "signIn">("signUp");
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

  function switchFlow(next: "signUp" | "signIn") {
    setFlow(next);
    setError(false);
  }

  return (
    <main className="theme-light grid min-h-dvh bg-canvas text-fg lg:grid-cols-[minmax(0,560px)_1fr]">
      {/* Brand side first so it sits on the right (RTL start): the same dark world as the landing hero */}
      <aside className="theme-dark relative m-3 hidden overflow-hidden rounded-[32px] bg-canvas text-fg [color-scheme:dark] lg:flex lg:flex-col">
        <div aria-hidden className="hero-dots absolute inset-0" />
        <div className="relative px-12 pt-16">
          <h2 className="text-[clamp(28px,2.6vw,38px)] leading-[1.3] font-bold text-balance">
            {t.rich("panelTitle", { hl: (c) => <span className="text-accent">{c}</span> })}
          </h2>
          <ul className="mt-8 space-y-4">
            {(t.raw("panelPoints") as string[]).map((p) => (
              <li key={p} className="flex items-center gap-3 text-fg-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-white">
                  <Check size={14} strokeWidth={2.5} aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-auto">
          <div aria-hidden className="hero-band absolute inset-x-0 top-[30%] h-[42%]" />
          <Image src={agent} alt={t("imageAlt")} priority sizes="520px" className="hero-image relative mx-auto w-full max-w-[520px]" />
        </div>
      </aside>
      {/* Form side */}
      <section className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 rounded-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <LogoBox size={28} />{tc("brand")}
          </Link>
          <Link href="/" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line-strong px-4 text-sm text-fg-2 transition-colors duration-150 hover:bg-fg/5 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent">
            {t("back")}<ArrowLeft size={15} strokeWidth={1.75} aria-hidden />
          </Link>
        </div>

        <div className="mx-auto my-auto w-full max-w-[400px] py-12">
          <div key={flow} className="animate-rise">
            <h1 className="text-[28px] leading-[1.3] font-bold">{flow === "signIn" ? t("signInTitle") : t("signUpTitle")}</h1>
            <p className="mt-2 text-fg-2">{flow === "signIn" ? t("signInSubtitle") : t("signUpSubtitle")}</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <input type="hidden" name="flow" value={flow} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium">{t("email")}</span>
              <input name="email" type="email" required autoComplete="email" dir="ltr" placeholder="you@company.com"
                aria-invalid={error || undefined} className={field} />
            </label>
            <label className="block">
              <span className="mb-2 flex items-baseline justify-between gap-3 text-sm font-medium">
                {t("password")}
                {flow === "signUp" && <span className="text-xs font-normal text-fg-3">{t("passwordHint")}</span>}
              </span>
              <input name="password" type="password" required minLength={8}
                autoComplete={flow === "signIn" ? "current-password" : "new-password"} dir="ltr"
                aria-invalid={error || undefined} className={field} />
            </label>
            <p className="-mt-2 text-sm text-fg-3">
              {flow === "signUp" ? t("haveAccount") : t("noAccount")}{" "}
              <button type="button" onClick={() => switchFlow(flow === "signUp" ? "signIn" : "signUp")}
                className="rounded font-medium text-accent underline-offset-4 transition-colors duration-150 hover:text-accent-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {flow === "signUp" ? t("toSignIn") : t("toSignUp")}
              </button>
            </p>
            {error && (
              <p role="alert" className="animate-rise rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm leading-[1.8] text-danger">
                {flow === "signIn" ? t("errorSignIn") : t("errorSignUp")}
              </p>
            )}
            <button disabled={pending}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-medium text-white shadow-[0_12px_32px_-12px_var(--accent)] transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            >
              {pending && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />}
              {flow === "signIn" ? t("signIn") : t("signUp")}
            </button>
          </form>
        </div>
      </section>

    </main>
  );
}
