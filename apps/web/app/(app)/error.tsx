"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { LostIllustration } from "@/components/illustrations";
import { button } from "@/components/ui";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <div role="alert" className="flex min-h-full flex-col items-center justify-center px-6 py-20 text-center">
      <LostIllustration className="w-56" />
      <h1 className="mt-6 text-xl font-bold">{t("pageTitle")}</h1>
      <p className="mt-2 max-w-sm text-sm leading-[1.9] text-pretty text-fg-2">{t("pageBody")}</p>
      <button onClick={reset} className={`${button.primary} mt-6`}>
        <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden />
        {t("retry")}
      </button>
    </div>
  );
}
