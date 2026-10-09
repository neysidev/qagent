"use client";

import { Toaster as Sonner } from "sonner";

/** The app's single toaster (shadcn's toast is Sonner too): bottom-right, RTL, styled with the design tokens. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      dir="rtl"
      theme="light"
      richColors
      toastOptions={{
        style: { fontFamily: "var(--font-peyda), sans-serif" },
        classNames: {
          toast: "!rounded-xl !border-line-strong !shadow-[0_16px_40px_-16px_rgb(0_0_0/0.25)] !gap-3 !px-4 !py-3.5",
          title: "!text-sm !font-bold",
          description: "!text-xs !leading-[1.8] !opacity-80",
        },
      }}
    />
  );
}
