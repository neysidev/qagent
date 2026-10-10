import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { Shell } from "./Shell";
import "./globals.css";

const peyda = localFont({
  src: [
    { path: "./fonts/peyda-regular.woff2", weight: "400" },
    { path: "./fonts/peyda-bold.woff2", weight: "700" },
  ],
  variable: "--font-peyda",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "نیلا · فروشگاه نمایشی", template: "%s · نیلا" },
  description: "فروشگاه نمایشی نیلا برای تست کیوایجنت",
};
export const viewport: Viewport = { themeColor: "#faf7f2" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={peyda.variable}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
