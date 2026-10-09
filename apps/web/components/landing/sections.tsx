import { ChevronDown, Link2, MousePointer2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";
import { LogoBox } from "@/components/brand/LogoBox";
import { PixelGrid } from "@/components/brand/PixelGrid";
import Image from "next/image";
import Link from "next/link";
import agent from "@/public/hero-agent.webp";
import { benchmark } from "@/lib/benchmark";
import { AudienceCards, Pricing, UseCaseTabs } from "./client";
import { badge, btn, card, container } from "./ui";

type Item = { title: string; body: string };
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

function Section({ id, tone = "canvas", children }: { id?: string; tone?: "canvas" | "surface"; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-line py-24 md:py-32 ${tone === "surface" ? "bg-surface" : "bg-canvas"}`}>
      <div className={container}>{children}</div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle, center = true }: { eyebrow: string; title: string; subtitle?: string; center?: boolean }) {
  return (
    <div data-reveal className={`mb-12 max-w-2xl md:mb-16 ${center ? "mx-auto text-center" : ""}`}>
      <p className="t-label text-accent">{eyebrow}</p>
      <h2 className="t-h2 mt-3">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-pretty text-fg-2">{subtitle}</p>}
    </div>
  );
}

export function AppFrame({ url, children, className = "" }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-line bg-shell ${className}`}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-pixel-off" />)}
        </span>
        <span dir="ltr" className="mx-auto max-w-[60%] truncate rounded-md bg-card px-3 py-1 font-mono text-xs text-fg-3">{url}</span>
        <span className="w-[42px]" aria-hidden />
      </div>
      {children}
    </div>
  );
}

function Cursor({ className = "" }: { className?: string }) {
  return <MousePointer2 aria-hidden size={20} strokeWidth={1.5} className={`fill-accent text-fg ${className}`} />;
}

export function Hero() {
  const t = useTranslations("landing.hero");
  return (
    <section data-hero className="theme-dark relative overflow-hidden bg-canvas pt-32 text-fg [color-scheme:dark] md:pt-40">
      <div aria-hidden className="hero-dots absolute inset-x-0 top-0 h-[70%]" />
      <div className={`${container} relative text-center`}>
        <h1 className="t-display hero-in mx-auto max-w-4xl !text-[clamp(30px,4.4vw,56px)]" style={stagger(0)}>
          <span className="block font-bold">{t("titleLead")}</span>
          <span className="block font-normal text-fg-2">{t("titleRest")}</span>
        </h1>
        <p className="hero-in mx-auto mt-5 max-w-xl text-base leading-[1.8] text-pretty text-fg-2" style={stagger(1)}>{t("subtitle")}</p>
        <div className="hero-in mt-10" style={stagger(2)}>
          <Link href="/signin" className="inline-flex h-13 items-center rounded-full bg-accent px-8 text-base font-medium text-on-accent shadow-[0_12px_32px_-10px_var(--accent)] transition-[transform,background-color] duration-150 ease-out hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97]">{t("cta")}</Link>
        </div>
      </div>
      <div className="relative mt-10 md:mt-6">
        <div aria-hidden className="hero-band absolute inset-x-0 top-[34%] h-[38%]" />
        <Image src={agent} alt={t("imageAlt")} priority sizes="(min-width: 768px) 760px, 100vw"
          className="hero-in hero-image relative mx-auto w-full max-w-[760px]" style={stagger(3)}
        />
      </div>
    </section>
  );
}

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=75`;
// Same order as landing.builtFor.items (stores, agencies, startups, SaaS, fintech, dev teams, product teams).
const audienceImages = [
  "1556742049-0cfed4f6a45d", "1522202176988-66273c2fd55f", "1559136555-9303baea8ebd", "1460925895917-afdab827c52f",
  "1563013544-824ae1b704d3", "1498050108023-c5249f4df085", "1521737604893-d14cc237f11d",
].map(unsplash);

export function BuiltFor() {
  const t = useTranslations("landing.builtFor");
  const items = (t.raw("items") as Item[]).map((it, i) => ({ ...it, image: audienceImages[i] }));
  return (
    <section className="scroll-mt-20 border-t border-line bg-canvas py-24 md:py-32">
      <div className={`${container} grid grid-cols-[1fr_auto] items-end`}>
        <div data-reveal className="max-w-xl">
          <h2 className="t-h2">{t("title")}</h2>
        </div>
        <AudienceCards items={items} labels={{ cta: t("cta"), prev: t("prev"), next: t("next") }} />
      </div>
    </section>
  );
}

export function Problem() {
  const t = useTranslations("landing.problem");
  const statements = t.raw("statements") as string[];
  const metrics = t.raw("metrics") as { label: string; value: string; unit: string; note: string }[];
  return (
    <Section tone="surface">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p data-reveal className="t-label text-accent">{t("eyebrow")}</p>
          <h2 data-reveal className="t-h2 mt-3">{t("title")}</h2>
          <ul className="mt-10 space-y-6">
            {statements.map((s, i) => (
              <li key={s} data-reveal style={stagger(i + 1)} className="border-s-2 border-line ps-5 text-xl text-fg-2 md:text-2xl">{s}</li>
            ))}
          </ul>
        </div>
        <div className="grid gap-4">
          {metrics.map((m, i) => (
            <div key={m.label} data-reveal style={stagger(i)} className={`${card} p-6`}>
              <p className="t-label text-fg-3">{m.label}</p>
              <p className="mt-3 flex items-baseline gap-2">
                <span dir="ltr" className="t-metric">{m.value}</span>
                <span className="text-fg-2">{m.unit}</span>
              </p>
              <p className="mt-2 text-sm text-fg-3">{m.note}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function HowItWorks() {
  const t = useTranslations("landing.how");
  const steps = t.raw("steps") as Item[];
  const frames = [
    <div key="form" className="space-y-3 p-4 text-xs">
      <p className="text-fg-3">{t("urlLabel")}</p>
      <p dir="ltr" className="rounded-md border border-line bg-card px-2.5 py-2 font-mono text-fg">https://myshop.ir</p>
      <p className="text-fg-3">{t("goalLabel")}</p>
      <p className="rounded-md border border-accent bg-card px-2.5 py-2 text-fg">{t("goalExample")}<span className="caret ms-0.5 text-accent">|</span></p>
      <span className={`${btn.primary("sm")} pointer-events-none`}>{t("run")}</span>
    </div>,
    <div key="run" className="relative space-y-2 p-4 text-xs">
      <span className={badge("running")}>{t("live")}</span>
      <div className="h-2 w-24 rounded bg-pixel-off" />
      <div className="h-7 rounded-md border border-line bg-card" />
      <div className="h-7 rounded-md border border-accent bg-card" />
      <div className="h-7 w-20 rounded-md bg-pixel-off" />
      <Cursor className="absolute end-10 top-[86px]" />
    </div>,
    <div key="report" className="space-y-2 p-4 text-xs">
      <span className={badge("bug")}>{t("high")}</span>
      <p className="text-sm font-medium">{t("reportTitle")}</p>
      <p className="text-fg-3">{t("reportSteps")}</p>
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        {[0, 1, 2].map((i) => <div key={i} className="aspect-[4/3] rounded border border-line bg-card" />)}
      </div>
    </div>,
  ];
  return (
    <Section id="how">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} data-reveal style={stagger(i)} className="flex flex-col">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full border border-line font-mono text-sm text-accent">{i + 1}</span>
              <h3 className="text-xl font-medium">{s.title}</h3>
            </div>
            <p className="mt-3 mb-6 text-fg-2">{s.body}</p>
            <AppFrame url={["app.qagent.ir/new", "app.qagent.ir/run", "app.qagent.ir/report"][i]} className="mt-auto">
              <div className="h-[230px] bg-canvas">{frames[i]}</div>
            </AppFrame>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function Features() {
  const t = useTranslations("landing.features");
  const items = t.raw("items") as Item[];
  const visuals: ReactNode[] = [
    <div key="live" className="relative grid h-full grid-cols-3 gap-2 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`rounded-lg border bg-card ${i === 1 ? "border-accent" : "border-line"}`} />
      ))}
      <Cursor className="absolute start-1/2 bottom-6" />
    </div>,
    <div key="evidence" className="relative h-full p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute h-[60%] w-[46%] rounded-lg border border-line bg-card" style={{ insetInlineStart: `${12 + i * 14}%`, top: `${14 + i * 6}%` }} />
      ))}
      <span dir="ltr" className="absolute end-4 bottom-4 rounded-md bg-danger-soft px-2 py-1 font-mono text-xs text-danger">500 DELETE /api/cart/12</span>
    </div>,
    <div key="rtl" className="flex h-full items-center p-4">
      <p dir="rtl" lang="fa" className="w-full rounded-lg border border-line bg-card px-3 py-2 font-[family-name:var(--font-peyda)] text-sm">
        {t("typed")}<span className="caret text-accent">|</span>
      </p>
    </div>,
    <div key="replay" className="flex h-full items-center justify-center gap-3 p-4">
      <span className="rounded-full border border-line bg-card px-3 py-1 text-sm">{t("replay")}</span>
      <span dir="ltr" className="font-mono text-2xl">$0.00</span>
    </div>,
    <div key="cost" className="flex h-full items-center justify-center p-4">
      <span dir="ltr" className="font-mono text-3xl">$0.031</span>
    </div>,
    <div key="parallel" className="flex h-full flex-col justify-center gap-3 p-4">
      {[0.8, 0.55, 0.95].map((w) => (
        <div key={w} className="h-1.5 overflow-hidden rounded-full bg-pixel-off">
          <div className="h-full origin-[left] rounded-full bg-fg-2 rtl:origin-[right]" style={{ transform: `scaleX(${w})` }} />
        </div>
      ))}
    </div>,
  ];
  // Two large cards (span 2 of 4 columns) + four small ones.
  const order = [0, 2, 3, 4, 5, 1];
  return (
    <Section id="features" tone="surface">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <ul className="grid gap-4 md:grid-cols-4">
        {order.map((idx, i) => (
          <li key={idx} data-reveal style={stagger(i)} className={`${card} flex flex-col overflow-hidden ${idx < 2 ? "md:col-span-2" : ""}`}>
            <div aria-hidden className="h-40 border-b border-line bg-canvas">{visuals[idx]}</div>
            <div className="p-6">
              <h3 className="text-lg font-medium">{items[idx].title}</h3>
              <p className="mt-2 text-sm text-fg-2">{items[idx].body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ReportShowcase() {
  const t = useTranslations("landing.report");
  const steps = t.raw("steps") as string[];
  const shots = t.raw("shots") as string[];
  return (
    <Section>
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <article className={`${card} mx-auto max-w-3xl p-6 md:p-8`}>
        <div data-reveal className="flex items-center justify-between gap-3">
          <span className={badge("bug")}>{t("high")}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-fg-2">
            <Link2 size={14} strokeWidth={1.5} aria-hidden />{t("share")}
          </span>
        </div>
        <h3 data-reveal style={stagger(1)} className="mt-4 text-xl font-medium md:text-2xl">{t("bugTitle")}</h3>
        <div data-reveal style={stagger(2)} className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-shell p-4">
            <p className="t-label text-success">{t("expectedLabel")}</p>
            <p className="mt-2 text-sm text-fg-2">{t("expected")}</p>
          </div>
          <div className="rounded-lg border border-line bg-shell p-4">
            <p className="t-label text-danger">{t("actualLabel")}</p>
            <p className="mt-2 text-sm text-fg-2">{t("actual")}</p>
          </div>
        </div>
        <div data-reveal style={stagger(3)} className="mt-6">
          <p className="t-label text-fg-3">{t("stepsLabel")}</p>
          <ol className="mt-3 space-y-2 text-sm">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="font-mono text-fg-3">{i + 1}.</span>
                <span className="text-fg-2">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div data-reveal style={stagger(4)} className="mt-6">
          <p className="t-label text-fg-3">{t("screenshotsLabel")}</p>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {shots.map((s, i) => (
              <li key={s}>
                <div aria-hidden className={`aspect-[4/3] rounded-lg border bg-canvas p-2 ${i === 1 ? "border-danger/40" : "border-line"}`}>
                  <div className="h-1.5 w-1/2 rounded bg-pixel-off" />
                  <div className="mt-2 h-3 rounded bg-pixel-off" />
                  <div className="mt-1.5 h-3 rounded bg-pixel-off" />
                </div>
                <p className="mt-1.5 text-xs text-fg-3">{s}</p>
              </li>
            ))}
          </ul>
        </div>
        <details data-reveal style={stagger(5)} className="group mt-6 rounded-lg border border-line bg-shell">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent">
            {t("technical")}
            <ChevronDown size={16} strokeWidth={1.5} aria-hidden className="text-fg-3 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <pre dir="ltr" className="overflow-x-auto border-t border-line px-4 py-3 font-mono text-xs leading-6 text-fg-2">
            <span className="text-danger">DELETE /api/cart/12 → 500 Internal Server Error</span>{"\n"}
            <span className="text-danger">console.error</span> Failed to remove item: Error 500{"\n"}
            GET /api/cart → 200 (item still present)
          </pre>
        </details>
      </article>
    </Section>
  );
}

export function Numbers() {
  const t = useTranslations("landing.numbers");
  const b = benchmark;
  const metrics = [
    b.detectionRate != null && { label: t("detection"), value: `${b.detectionRate}%` },
    b.avgRunSeconds != null && { label: t("runTime"), value: `${b.avgRunSeconds}s` },
    b.avgCostUsd != null && { label: t("cost"), value: `$${b.avgCostUsd.toFixed(2)}` },
    { label: t("templates"), value: String(b.templates) },
    { label: t("parallel"), value: String(b.parallelScenarios) },
  ].filter((m) => !!m);
  const measured = b.detectionRate != null;
  return (
    <section className="relative overflow-hidden border-t border-line bg-surface py-24 md:py-32">
      <PixelGrid cols={80} rows={24} cell={10} gap={6} density={0.05} className="absolute inset-0 size-full opacity-40" />
      <div className={`${container} relative`}>
        <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={measured ? t("subtitle") : undefined} />
        <dl className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4">
          {metrics.map((m, i) => (
            <div key={m.label} data-reveal style={stagger(i)} className={`${card} min-w-[200px] flex-1 p-6 text-center`}>
              <dd dir="ltr" className="t-metric text-[clamp(40px,5vw,64px)]">{m.value}</dd>
              <dt className="mt-2 text-sm text-fg-2">{m.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function UseCases() {
  const t = useTranslations("landing.useCases");
  return (
    <Section>
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />
      <div data-reveal>
        <UseCaseTabs items={t.raw("items")} labels={{ tabs: t("tabs"), pain: t("pain"), goal: t("goal"), outcome: t("outcome") }} />
      </div>
    </Section>
  );
}

export function PricingSection() {
  const t = useTranslations("landing.pricing");
  return (
    <Section id="pricing" tone="surface">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <Pricing plans={t.raw("plans")}
        labels={{ period: t("period"), monthly: t("monthly"), yearly: t("yearly"), perMonth: t("perMonth"), billedYearly: t("billedYearly"), popular: t("popular") }}
      />
    </Section>
  );
}

export function Faq() {
  const t = useTranslations("landing.faq");
  const items = t.raw("items") as { q: string; a: string }[];
  return (
    <Section id="faq">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />
      <div className="mx-auto max-w-3xl divide-y divide-line border-y border-line">
        {items.map((it, i) => (
          <details key={it.q} name="faq" data-reveal style={stagger(i)} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              {it.q}
              <ChevronDown size={20} strokeWidth={1.5} aria-hidden className="shrink-0 text-fg-3 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="pb-5 text-fg-2">{it.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function FinalCta() {
  const t = useTranslations("landing.cta");
  const h = useTranslations("landing.hero");
  return (
    <section className="border-t border-line bg-surface py-24 md:py-32">
      <div data-reveal className={`${container} flex flex-col items-center text-center`}>
        <LogoBox state="pass" size={96} />
        <h2 className="t-display mt-8 max-w-3xl text-[clamp(32px,4vw,52px)]">{t("title")}</h2>
        <p className="mt-4 max-w-xl text-lg text-fg-2">{t("subtitle")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/signin" className={btn.primary("lg")}>{h("start")}</Link>
          <Link href="/signin" className={btn.secondary("lg")}>{h("demo")}</Link>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const t = useTranslations("landing.footer");
  const n = useTranslations("landing.nav");
  const link = "text-fg-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent rounded";
  return (
    <footer className="border-t border-line bg-shell py-16">
      <div className={`${container} grid gap-10 md:grid-cols-[2fr_1fr_1fr]`}>
        <div>
          <p className="flex items-center gap-2 font-semibold"><LogoBox size={26} />کیوایجنت</p>
          <p className="mt-3 max-w-xs text-sm text-fg-2">{t("tagline")}</p>
        </div>
        <nav aria-label={t("product")}>
          <p className="t-label text-fg-3">{t("product")}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {(["features", "how", "pricing", "faq"] as const).map((k) => (
              <li key={k}><a href={`#${k}`} className={link}>{n(k)}</a></li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t("start")}>
          <p className="t-label text-fg-3">{t("start")}</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/signin" className={link}>{n("start")}</Link></li>
            <li><Link href="/signin" className={link}>{n("login")}</Link></li>
          </ul>
        </nav>
      </div>
      <div className={`${container} mt-12 flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-xs text-fg-3`}>
        <span>{t("rights")}</span>
        <span>{t("built")}</span>
      </div>
    </footer>
  );
}
