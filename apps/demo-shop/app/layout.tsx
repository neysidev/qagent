import type { ReactNode } from "react";
import { Shell } from "./Shell";
import "./globals.css";

export const metadata = { title: "Demo Shop · فروشگاه دمو" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
