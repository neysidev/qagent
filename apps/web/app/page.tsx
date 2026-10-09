import { useTranslations } from "next-intl";
import { Nav, RevealObserver } from "@/components/landing/client";
import {
  BuiltFor, Faq, Features, FinalCta, Footer, Hero, HowItWorks, Numbers, PricingSection, Problem, ReportShowcase, UseCases,
} from "@/components/landing/sections";

export default function Landing() {
  const t = useTranslations("landing.nav");
  const labels = Object.fromEntries(
    (["features", "how", "pricing", "faq", "login", "start", "menu", "close", "home"] as const).map((k) => [k, t(k)]),
  ) as Parameters<typeof Nav>[0]["labels"];

  return (
    <div className="min-h-dvh bg-canvas text-fg [color-scheme:dark]">
      <Nav labels={labels} />
      <main>
        <Hero />
        <BuiltFor />
        <Problem />
        <HowItWorks />
        <Features />
        <ReportShowcase />
        <Numbers />
        <UseCases />
        <PricingSection />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <RevealObserver />
    </div>
  );
}
