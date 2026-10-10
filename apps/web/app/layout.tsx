import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Toaster } from "@/components/Toaster";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const peyda = localFont({
  src: [
    { path: "./fonts/peyda-regular.woff2", weight: "400" },
    { path: "./fonts/peyda-bold.woff2", weight: "700" },
  ],
  variable: "--font-peyda",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const description = "ایجنت هوشمندی که مسیرهای سایتت را مثل یک کاربر واقعی تست می‌کند.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "کیوایجنت", template: "%s | کیوایجنت" },
  description,
  applicationName: "کیوایجنت",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "fa_IR", siteName: "کیوایجنت", title: "کیوایجنت", description, url: "/" },
  twitter: { card: "summary_large_image", title: "کیوایجنت", description },
};

export const viewport: Viewport = { themeColor: "#f26b1d" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "کیوایجنت",
  description,
  url: SITE_URL,
  inLanguage: "fa",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ConvexAuthNextjsServerProvider>
    <html lang="fa" dir="rtl" className={`${peyda.variable} ${geist.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <NextIntlClientProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
    </ConvexAuthNextjsServerProvider>
  );
}
