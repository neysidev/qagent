import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Header } from "@/components/Header";
import { Link, type Locale } from "@/i18n/routing";

export default function Landing({ params }: PageProps<"/[locale]">) {
  setRequestLocale(use(params).locale as Locale);
  const t = useTranslations("landing");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{t("title")}</h1>
        <p className="mt-6 text-lg text-pretty text-zinc-600 dark:text-zinc-400">{t("subtitle")}</p>
        <Link
          href="/signin"
          className="mt-10 inline-block rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {t("cta")}
        </Link>
      </main>
    </>
  );
}
