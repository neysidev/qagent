import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Header } from "@/components/Header";
import { button, card } from "@/components/ui";
import { Link, type Locale } from "@/i18n/routing";

function DemoMock() {
  // Static stand-in for a live run: a cart page, highlighted Remove button, agent cursor + action chip.
  return (
    <div dir="ltr" className={`${card} overflow-hidden shadow-xl shadow-zinc-900/5`}>
      <div className="flex items-center gap-1.5 border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-green-400" />
        <span className="ms-3 truncate rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
          demo-shop.app/cart
        </span>
      </div>
      <div className="relative space-y-3 p-6 text-sm">
        <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
        {["Ceramic Mug", "Earl Grey Tea"].map((name, i) => (
          <div key={name} className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <span>{name}</span>
            <span className="flex items-center gap-3">
              <span className="rounded border border-zinc-300 px-2 dark:border-zinc-700">{i ? 1 : 2}</span>
              <span className={`rounded-md px-2 py-1 ${i ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-100 ring-2 ring-rose-500 dark:bg-zinc-800"}`}>
                Remove
              </span>
            </span>
          </div>
        ))}
        <div className="absolute top-[86px] right-14">
          <svg viewBox="0 0 24 24" className="size-6 drop-shadow-md" aria-hidden>
            <path d="M3 2l7.5 19 2.6-7.9L21 10.5z" fill="#111" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <span className="absolute top-6 right-0 rounded-full bg-zinc-900 px-2.5 py-1 text-xs whitespace-nowrap text-white">
            Click: Remove
          </span>
        </div>
        <div className="rounded-lg bg-red-50 p-3 font-mono text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
          DELETE /api/cart/1 → 500
        </div>
      </div>
    </div>
  );
}

export default function Landing({ params }: PageProps<"/[locale]">) {
  setRequestLocale(use(params).locale as Locale);
  const t = useTranslations("landing");

  const steps = [1, 2, 3].map((n) => ({
    n,
    title: t(`step${n}Title` as "step1Title"),
    body: t(`step${n}Body` as "step1Body"),
  }));
  const tiers = (["free", "pro", "agency"] as const).map((key) => ({
    key,
    name: t(key),
    price: t(`${key}Price`),
    features: t(`${key}Features`).split("|"),
  }));

  return (
    <>
      <Header />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <div className="space-y-6">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {t("badge")}
            </span>
            <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">{t("title")}</h1>
            <p className="text-lg text-pretty text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signin" className={`${button.accent} px-6 py-3 text-base`}>
                {t("cta")}
              </Link>
              <a href="#how" className={`${button.secondary} px-6 py-3 text-base`}>
                {t("secondary")}
              </a>
            </div>
          </div>
          <figure className="space-y-3">
            <DemoMock />
            <figcaption className="text-center text-sm text-zinc-500">{t("demoCaption")}</figcaption>
          </figure>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16">
          <h2 className="mb-8 text-center text-3xl font-bold">{t("howTitle")}</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className={`${card} p-6`}>
                <span className="grid size-9 place-items-center rounded-full bg-blue-600 font-semibold text-white">{s.n}</span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-pretty text-zinc-600 dark:text-zinc-400">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-8 text-center text-3xl font-bold">{t("pricingTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.key}
                className={`${card} relative p-6 ${tier.key === "pro" ? "ring-2 ring-blue-600" : ""}`}
              >
                {tier.key === "pro" && (
                  <span className="absolute -top-3 start-6 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                    {t("popular")}
                  </span>
                )}
                <h3 className="font-semibold">{tier.name}</h3>
                <p className="mt-3">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.key !== "free" && <span className="text-sm text-zinc-500"> {t("perMonth")}</span>}
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-blue-600" aria-hidden>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/signin" className={`${button.accent} px-8 py-3 text-base`}>
              {t("cta")}
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
        {t("footer")}
      </footer>
    </>
  );
}
