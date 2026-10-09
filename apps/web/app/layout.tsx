import { NextIntlClientProvider } from "next-intl";
import localFont from "next/font/local";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const peyda = localFont({
  src: [
    { path: "./fonts/peyda-regular.woff2", weight: "400" },
    { path: "./fonts/peyda-bold.woff2", weight: "700" },
  ],
  variable: "--font-peyda",
});

export const metadata = { title: "کیوایجنت", description: "ایجنت هوشمندی که مسیرهای سایتت را مثل یک کاربر واقعی تست می‌کند." };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${peyda.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <NextIntlClientProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
