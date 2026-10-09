import { useTranslations } from "next-intl";
import { Nav, RevealObserver } from "@/components/landing/client";
import { MotionRoot, ScrollProgress } from "@/components/landing/motion";
import {
  BuiltFor, Faq, Features, FinalCta, Footer, Hero, HowItWorks, PricingSection, Problem, ReportShowcase,
} from "@/components/landing/sections";

export default function Landing() {
  const t = useTranslations("landing.nav");
  const labels = Object.fromEntries(
    (["how", "features", "report", "pricing", "faq", "login", "start", "menu", "close", "home"] as const).map((k) => [k, t(k)]),
  ) as Parameters<typeof Nav>[0]["labels"];

  return (
    <MotionRoot>
      <div className="min-h-dvh theme-light bg-canvas text-fg">
        <ScrollProgress />
        <Nav labels={labels} />
        <main>
          <Hero />
          <BuiltFor />
          <Problem />
          <HowItWorks />
          <Features />
          <ReportShowcase />
          <PricingSection />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
        <RevealObserver />
      </div>
    </MotionRoot>
  );
}
