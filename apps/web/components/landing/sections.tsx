import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";
import { LogoBox } from "@/components/brand/LogoBox";
import { PixelGrid } from "@/components/brand/PixelGrid";
import Image from "next/image";
import Link from "next/link";
import agent from "@/public/hero-agent.webp";
import { benchmark } from "@/lib/benchmark";
import { AudienceCards, Pricing, ReportFormats, UseCaseTabs, type ReportDoc } from "./client";
import { btn, card, container } from "./ui";

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

const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
type ProblemArt = { checklist: string; flows: string[]; hours: string; everyRelease: string; complaint: string; complaintMeta: string };

/** 01: a release checklist re-clicked by hand, half done, with the hours it eats. */
function ManualArt({ a }: { a: ProblemArt }) {
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="90" y="12" width="190" height="176" rx="14" className="fill-card stroke-line-strong" />
      <text x="262" y="38" direction="rtl" fontSize="12" fontWeight="700" className="fill-fg">{a.checklist}</text>
      {a.flows.map((f, i) => {
        const y = 62 + i * 26;
        const done = i < 2;
        return (
          <g key={f}>
            <rect x="248" y={y - 10} width="14" height="14" rx="4" className={done ? "fill-accent" : "fill-card stroke-line-strong"} />
            {done && <path d={`M251.5 ${y - 3} l3 3 l5.5 -6`} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />}
            <text x="240" y={y + 1} direction="rtl" fontSize="11" className={done ? "fill-fg-3" : "fill-fg-2"} textDecoration={done ? "line-through" : undefined}>{f}</text>
            <rect x="108" y={y - 6} width={done ? 70 : 54 + i * 6} height="6" rx="3" className="fill-pixel-off" />
          </g>
        );
      })}
      <path d="M258 112 l0 16 l4 -4 l3 7 l3 -1.4 l-3 -7 l5.6 0 z" className="fill-fg stroke-card" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="48" cy="52" r="26" className="fill-card stroke-line-strong" />
      <path d="M48 38 v14 l9 6" fill="none" className="stroke-fg" strokeWidth="2" strokeLinecap="round" />
      <text x="48" y="96" direction="rtl" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-fg">{a.hours}</text>
      <rect x="10" y="150" width="96" height="28" rx="14" className="fill-accent-soft" />
      <g transform="translate(20 157) scale(0.6)" fill="none" className="stroke-accent" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </g>
      <text x="96" y="168" direction="rtl" fontSize="11" className="fill-accent">{a.everyRelease}</text>
    </svg>
  );
}

/** 02: network log quietly 500-ing while the first report comes from a customer. */
function CustomerArt({ a }: { a: ProblemArt }) {
  const log = [["200", "GET /products"], ["200", "POST /cart"], ["200", "PATCH /cart/12"], ["500", "DELETE /cart/12"]];
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="20" y="12" width="250" height="140" rx="12" className="fill-card stroke-line-strong" />
      <path d="M20 34 h250" className="stroke-line-strong" />
      {[34, 44, 54].map((x) => <circle key={x} cx={x} cy="23" r="3" className="fill-pixel-off" />)}
      <g direction="ltr" fontFamily={mono} fontSize="11">
        {log.map(([code, path], i) => {
          const y = 54 + i * 22;
          const bad = code === "500";
          return (
            <g key={path}>
              {bad && <rect x="28" y={y - 13} width="234" height="20" rx="5" className="fill-danger-soft" />}
              <text x="38" y={y} className={bad ? "fill-danger" : "fill-success"}>{code}</text>
              <text x="70" y={y} className={bad ? "fill-danger" : "fill-fg-2"}>{path}</text>
            </g>
          );
        })}
      </g>
      <rect x="110" y="138" width="196" height="54" rx="16" className="fill-card stroke-line-strong" />
      <circle cx="284" cy="165" r="12" className="fill-accent-soft" />
      <circle cx="284" cy="161.5" r="4" className="fill-accent" />
      <path d="M277 172 a7 6 0 0 1 14 0" className="fill-accent" />
      <text x="264" y="161" direction="rtl" fontSize="12" fontWeight="700" className="fill-fg">{a.complaint}</text>
      <text x="264" y="179" direction="rtl" fontSize="10" className="fill-fg-3">{a.complaintMeta}</text>
    </svg>
  );
}

/** 03: a selector-based test that broke because the button changed. */
function BrittleArt() {
  const code: [string, string?][] = [
    ['test("checkout", async () => {'],
    ['  await page.goto(', '"/cart")'],
    ['  await page.click(', '"#checkout-btn")'],
    ["  expect(order).toBeVisible()"],
    ["})"],
  ];
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="14" y="12" width="292" height="134" rx="12" className="fill-card stroke-line-strong" />
      <g direction="ltr" fontFamily={mono} fontSize="10.5">
        {code.map(([c, str], i) => {
          const y = 38 + i * 22;
          return (
            <g key={i}>
              {i === 2 && <rect x="20" y={y - 14} width="280" height="20" rx="5" className="fill-danger-soft" />}
              <text x="28" y={y} className="fill-fg-3">{i + 1}</text>
              <text x="46" y={y} xmlSpace="preserve" className="fill-fg-2">
                {c}{str && <tspan className={i === 2 ? "fill-danger" : "fill-accent"}>{str}</tspan>}
              </text>
            </g>
          );
        })}
      </g>
      <path d="M172 89 q3 -3 6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0 t6 0" fill="none" className="stroke-danger" strokeWidth="1.2" />
      <rect x="128" y="158" width="178" height="30" rx="15" className="fill-danger-soft" />
      <circle cx="146" cy="173" r="7" className="fill-danger" />
      <path d="M143.5 170.5 l5 5 M148.5 170.5 l-5 5" className="stroke-card" strokeWidth="1.5" strokeLinecap="round" />
      <text x="160" y="177" direction="ltr" fontFamily={mono} fontSize="11" className="fill-danger">Element not found</text>
      <rect x="14" y="158" width="100" height="30" rx="8" fill="none" strokeDasharray="4 3" className="stroke-line-strong" />
      <text x="64" y="177" textAnchor="middle" direction="ltr" fontFamily={mono} fontSize="10" className="fill-fg-3">.btn-pay</text>
    </svg>
  );
}

export function Problem() {
  const t = useTranslations("landing.problem");
  const items = t.raw("items") as Item[];
  const a = t.raw("art") as ProblemArt;
  const arts = [<ManualArt key="m" a={a} />, <CustomerArt key="c" a={a} />, <BrittleArt key="b" />];
  return (
    <Section tone="surface">
      <div data-reveal className="max-w-2xl">
        <p className="inline-flex rounded-full border border-line bg-card px-3 py-1 text-sm text-fg-2">{t("eyebrow")}</p>
        <h2 className="mt-5 text-[clamp(24px,2.6vw,34px)] leading-[1.3] font-bold text-balance">
          {t.rich("title", { hl: (c) => <span className="text-accent">{c}</span> })}
        </h2>
        <p className="mt-3 text-pretty text-fg-2">{t("subtitle")}</p>
      </div>
      {/* One tray holding all three cards, so they read as a single block. */}
      <ul className="mt-12 grid gap-1.5 rounded-[28px] border border-line bg-fg/[0.03] p-1.5 md:grid-cols-3">
        {items.map((it, i) => (
          <li key={it.title} data-reveal style={stagger(i)} className="flex flex-col overflow-hidden rounded-[22px] bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:p-6">
            <h3 className="text-lg font-bold">{it.title}</h3>
            <p className="mt-2 text-sm leading-[1.9] text-fg-2">{it.body}</p>
            <div className="mt-auto aspect-[8/5] pt-6">{arts[i]}</div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

type HowArt = {
  urlLabel: string; noCode: string; noSdk: string; goalLabel: string; goalExample: string;
  templates: string[]; run: string; high: string; reportTitle: string; reportSteps: string[];
};

/** 01: just a URL field, nothing to install. */
function UrlArt({ a }: { a: HowArt }) {
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="20" y="24" width="280" height="118" rx="14" className="fill-card stroke-line-strong" />
      <text x="282" y="54" direction="rtl" fontSize="12" fontWeight="700" className="fill-fg">{a.urlLabel}</text>
      <rect x="38" y="68" width="244" height="40" rx="10" className="fill-card stroke-accent" strokeWidth="1.5" />
      <g transform="translate(52 80) scale(0.68)" fill="none" className="stroke-fg-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
      </g>
      <text x="76" y="93" fontFamily={mono} fontSize="13" className="fill-fg">https://myshop.ir</text>
      <rect x="216" y="80" width="1.5" height="16" className="caret fill-accent" />
      {/* Chips line up from the right edge (RTL start): check icon first, then the label. */}
      {[a.noCode, a.noSdk].map((label, i) => {
        const right = 300 - i * 86;
        return (
          <g key={label}>
            <rect x={right - 78} y="156" width="78" height="28" rx="14" className="fill-success-soft" />
            <path d={`M${right - 22} 170 l3 3 l5 -6`} fill="none" className="stroke-success" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <text x={right - 28} y="174.5" direction="rtl" fontSize="11" className="fill-success">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** 02: the goal in plain words, a few starter templates, and the run button. */
function GoalArt({ a }: { a: HowArt }) {
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="20" y="12" width="280" height="176" rx="14" className="fill-card stroke-line-strong" />
      <text x="282" y="40" direction="rtl" fontSize="12" fontWeight="700" className="fill-fg">{a.goalLabel}</text>
      <rect x="38" y="52" width="244" height="54" rx="10" className="fill-card stroke-accent" strokeWidth="1.5" />
      <text x="268" y="76" direction="rtl" fontSize="12" className="fill-fg">{a.goalExample}</text>
      {a.templates.map((label, i) => {
        const x = 282 - i * 64;
        return (
          <g key={label}>
            <rect x={x - 58} y="116" width="58" height="24" rx="12" className="fill-card stroke-line-strong" />
            <text x={x - 29} y="132" direction="rtl" textAnchor="middle" fontSize="10.5" className="fill-fg-2">{label}</text>
          </g>
        );
      })}
      <rect x="38" y="150" width="96" height="28" rx="14" className="fill-accent" />
      <path d="M52 158 v12 l9 -6 z" fill="#fff" />
      <text x="124" y="168" direction="rtl" fontSize="11.5" fontWeight="700" fill="#fff">{a.run}</text>
    </svg>
  );
}

/** 03: a bug report with severity, repro steps and screenshots. */
function ReportArt({ a }: { a: HowArt }) {
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="20" y="12" width="280" height="176" rx="14" className="fill-card stroke-line-strong" />
      <rect x="244" y="26" width="40" height="20" rx="10" className="fill-danger-soft" />
      <circle cx="274" cy="36" r="2.5" className="fill-danger" />
      <text x="268" y="40" direction="rtl" fontSize="10.5" className="fill-danger">{a.high}</text>
      <text x="284" y="68" direction="rtl" fontSize="12.5" fontWeight="700" className="fill-fg">{a.reportTitle}</text>
      {a.reportSteps.map((step, i) => {
        const y = 92 + i * 20;
        return (
          <g key={step}>
            <circle cx="278" cy={y - 4} r="7" className="fill-pixel-off" />
            <text x="278" y={y - 0.5} textAnchor="middle" fontSize="9" className="fill-fg-2">{(i + 1).toLocaleString("fa-IR")}</text>
            <text x="264" y={y} direction="rtl" fontSize="11" className="fill-fg-2">{step}</text>
          </g>
        );
      })}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={36 + i * 84} y="146" width="76" height="30" rx="6" className={i === 2 ? "fill-danger-soft stroke-danger" : "fill-shell stroke-line-strong"} strokeWidth="1" />
          <rect x={44 + i * 84} y="154" width="30" height="4" rx="2" className={i === 2 ? "fill-danger" : "fill-pixel-off"} />
          <rect x={44 + i * 84} y="162" width="48" height="4" rx="2" className="fill-pixel-off" />
        </g>
      ))}
    </svg>
  );
}

export function HowItWorks() {
  const t = useTranslations("landing.how");
  const steps = t.raw("steps") as Item[];
  const a = t.raw("art") as HowArt;
  const arts = [<UrlArt key="u" a={a} />, <GoalArt key="g" a={a} />, <ReportArt key="r" a={a} />];
  return (
    <Section id="how">
      <div data-reveal className="max-w-2xl">
        <p className="inline-flex rounded-full border border-line bg-card px-3 py-1 text-sm text-fg-2">{t("eyebrow")}</p>
        <h2 className="mt-5 text-[clamp(24px,2.6vw,34px)] leading-[1.3] font-bold text-balance">
          {t.rich("title", { hl: (c) => <span className="text-accent">{c}</span> })}
        </h2>
        <p className="mt-3 text-pretty text-fg-2">{t("subtitle")}</p>
      </div>
      <ol className="mt-12 grid gap-1.5 rounded-[28px] border border-line bg-fg/[0.03] p-1.5 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} data-reveal style={stagger(i)} className="flex flex-col overflow-hidden rounded-[22px] bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:p-6">
            <h3 className="text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-[1.9] text-fg-2">{s.body}</p>
            <div className="mt-auto aspect-[8/5] pt-6">{arts[i]}</div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

type FeatureArt = {
  live: string; agent: string; addToCart: string; product: string; step: string; goal: string; scenarios: string[];
  changed: string; oldButton: string; newButton: string; healed: string; login: string; testAccount: string;
  dashboard: string; copy: string; noAccount: string; bugCount: string;
};

/** Agent pointer with an orange body, used wherever the agent "acts" in an illustration. */
function AgentPointer({ x, y }: { x: number; y: number }) {
  return (
    <path d={`M${x} ${y} l0 17 l4.5 -4.2 l3.2 7.4 l3 -1.3 l-3.2 -7.3 l6.2 -0.4 z`} className="fill-accent stroke-card" strokeWidth="1.4" strokeLinejoin="round" />
  );
}

function Check({ x, y, tone = "stroke-success" }: { x: number; y: number; tone?: string }) {
  return <path d={`M${x - 3.5} ${y} l2.5 2.5 l5 -5.5`} fill="none" className={tone} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />;
}

/** Live viewer: the agent's pointer pressing "add to cart" inside a streamed browser frame. */
function LiveArt({ a }: { a: FeatureArt }) {
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="16" y="10" width="288" height="180" rx="14" className="fill-card stroke-line-strong" />
      <path d="M16 36 h288" className="stroke-line" />
      {[30, 40, 50].map((x) => <circle key={x} cx={x} cy="23" r="3" className="fill-pixel-off" />)}
      <rect x="96" y="16" width="128" height="14" rx="7" className="fill-shell" />
      <text x="160" y="26.5" textAnchor="middle" fontFamily={mono} fontSize="8.5" className="fill-fg-3">myshop.ir/product/12</text>
      <rect x="250" y="16" width="44" height="14" rx="7" className="fill-danger-soft" />
      <circle cx="285" cy="23" r="2.5" className="fill-danger"><animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" /></circle>
      <text x="279" y="26.5" direction="rtl" fontSize="8.5" className="fill-danger">{a.live}</text>
      <rect x="180" y="48" width="108" height="96" rx="10" className="fill-shell" />
      <path d="M210 112 q24 -34 48 0 z" className="fill-pixel-off" />
      <circle cx="246" cy="76" r="9" className="fill-pixel-off" />
      <text x="166" y="64" direction="rtl" fontSize="12" fontWeight="700" className="fill-fg">{a.product}</text>
      <rect x="96" y="74" width="70" height="5" rx="2.5" className="fill-pixel-off" />
      <rect x="116" y="85" width="50" height="5" rx="2.5" className="fill-pixel-off" />
      <rect x="32" y="104" width="134" height="32" rx="9" className="fill-accent" />
      <rect x="29" y="101" width="140" height="38" rx="12" fill="none" className="stroke-accent" strokeOpacity="0.35" strokeWidth="2" />
      <text x="99" y="124" direction="rtl" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#fff">{a.addToCart}</text>
      <AgentPointer x={118} y={122} />
      <rect x="134" y="146" width="62" height="18" rx="9" className="fill-fg" />
      <text x="165" y="158.5" direction="rtl" textAnchor="middle" fontSize="9" className="fill-card">{a.agent}</text>
      <rect x="32" y="172" width="256" height="4" rx="2" className="fill-pixel-off" />
      <rect x="142" y="172" width="146" height="4" rx="2" className="fill-accent" />
      <text x="288" y="166" direction="rtl" fontSize="9" className="fill-fg-3">{a.step}</text>
    </svg>
  );
}

/** Evidence: an annotated screenshot plus the console and network lines captured with it. */
function EvidenceArt() {
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="40" y="18" width="240" height="104" rx="12" className="fill-shell stroke-line-strong" transform="rotate(-3 160 70)" />
      <rect x="28" y="12" width="264" height="110" rx="12" className="fill-card stroke-line-strong" />
      <rect x="44" y="28" width="60" height="6" rx="3" className="fill-pixel-off" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x="44" y={46 + i * 32} width="232" height="26" rx="7" className="fill-shell" />
          <rect x="230" y={53 + i * 32} width="38" height="12" rx="3" className="fill-pixel-off" />
          <rect x="60" y={55 + i * 32} width="80" height="5" rx="2.5" className="fill-pixel-off" />
          <rect x="52" y={51 + i * 32} width="30" height="16" rx="5" className={i ? "fill-card stroke-line-strong" : "fill-card stroke-danger"} strokeWidth="1.2" />
        </g>
      ))}
      <rect x="46" y="47" width="42" height="24" rx="7" fill="none" className="stroke-danger" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="88" cy="47" r="7" className="fill-danger" />
      <text x="88" y="50.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">1</text>
      <g fontFamily={mono} fontSize="10">
        <rect x="28" y="134" width="264" height="24" rx="8" className="fill-danger-soft" />
        <circle cx="42" cy="146" r="5" className="fill-danger" />
        <path d="M40 144 l4 4 M44 144 l-4 4" className="stroke-card" strokeWidth="1.3" strokeLinecap="round" />
        <text x="54" y="149.5" className="fill-danger">TypeError: cart.items is undefined</text>
        <rect x="28" y="164" width="264" height="24" rx="8" className="fill-shell stroke-line" />
        <rect x="36" y="170" width="30" height="12" rx="4" className="fill-danger" />
        <text x="51" y="179" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">500</text>
        <text x="74" y="179.5" className="fill-fg-2">DELETE /api/cart/12</text>
        <text x="284" y="179.5" textAnchor="end" className="fill-fg-3">412ms</text>
      </g>
    </svg>
  );
}

/** Planner: one plain goal fanning out into separate scenarios, each with its own status. */
function ScenariosArt({ a }: { a: FeatureArt }) {
  const rows = [36, 100, 164];
  const states = ["pass", "pass", "run"] as const;
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="200" y="82" width="104" height="36" rx="12" className="fill-card stroke-accent" strokeWidth="1.5" />
      <text x="290" y="104.5" direction="rtl" fontSize="11.5" fontWeight="700" className="fill-fg">{a.goal}</text>
      {rows.map((y) => (
        <path key={y} d={`M200 100 C176 100 176 ${y} 152 ${y}`} fill="none" className="stroke-line-strong" strokeDasharray="3 3" />
      ))}
      {rows.map((y, i) => (
        <g key={y}>
          <rect x="16" y={y - 18} width="136" height="36" rx="10" className="fill-card stroke-line-strong" />
          <text x="138" y={y + 4} direction="rtl" fontSize="11" className="fill-fg">{a.scenarios[i]}</text>
          {states[i] === "pass" ? (
            <g>
              <circle cx="34" cy={y} r="9" className="fill-success-soft" />
              <Check x={34} y={y} />
            </g>
          ) : (
            <g>
              <circle cx="34" cy={y} r="9" className="fill-warning-soft" />
              <circle cx="34" cy={y} r="5" fill="none" className="stroke-warning" strokeWidth="1.8" strokeDasharray="18 12" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from={`0 34 ${y}`} to={`360 34 ${y}`} dur="1.2s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
          <circle cx="152" cy={y} r="3" className="fill-accent" />
        </g>
      ))}
      <circle cx="200" cy="100" r="3" className="fill-accent" />
    </svg>
  );
}

/** Self-healing replay: recorded steps replay until the page changed, then the agent finds the new button. */
function ReplayArt({ a }: { a: FeatureArt }) {
  const nodes = [272, 204, 136, 68];
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <path d="M272 52 H68" className="stroke-line-strong" strokeWidth="2" />
      <path d="M272 52 H136" className="stroke-success" strokeWidth="2" />
      {nodes.map((x, i) => (
        <g key={x}>
          {i === 2 ? (
            <>
              <circle cx={x} cy="52" r="15" className="fill-accent-soft" />
              <circle cx={x} cy="52" r="10" className="fill-accent" />
              <path d={`M${x - 3.5} 47.5 a5 5 0 1 1 -1 6.5 M${x - 3.5} 47.5 v3.5 h3.5`} fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <circle cx={x} cy="52" r="10" className={i < 2 ? "fill-success-soft" : "fill-card stroke-line-strong"} />
              {i < 2 && <Check x={x} y={52} />}
            </>
          )}
        </g>
      ))}
      <rect x="92" y="14" width="88" height="20" rx="10" className="fill-accent-soft" />
      <text x="136" y="28" direction="rtl" textAnchor="middle" fontSize="10" className="fill-accent">{a.changed}</text>
      <rect x="20" y="84" width="280" height="102" rx="14" className="fill-card stroke-line-strong" />
      <rect x="180" y="112" width="104" height="34" rx="10" fill="none" className="stroke-line-strong" strokeDasharray="4 3" />
      <text x="232" y="133.5" direction="rtl" textAnchor="middle" fontSize="11" className="fill-fg-3" textDecoration="line-through">{a.oldButton}</text>
      <path d="M168 129 H132" className="stroke-fg-3" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M138 124 l-6 5 l6 5" fill="none" className="stroke-fg-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="36" y="112" width="88" height="34" rx="10" className="fill-accent" />
      <text x="80" y="133.5" direction="rtl" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{a.newButton}</text>
      <AgentPointer x={98} y={134} />
      <rect x="220" y="158" width="64" height="20" rx="10" className="fill-success-soft" />
      <Check x={270} y={168} />
      <text x="262" y="172" direction="rtl" fontSize="9.5" className="fill-success">{a.healed}</text>
    </svg>
  );
}

/** Logged-in flows: a test account signs in, and the dashboard behind it gets tested too. */
function LoginArt({ a }: { a: FeatureArt }) {
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="16" y="40" width="130" height="146" rx="14" className="fill-shell stroke-line-strong" />
      <text x="132" y="62" direction="rtl" fontSize="11" fontWeight="700" className="fill-fg-2">{a.dashboard}</text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="28" y={74 + i * 34} width="106" height="26" rx="7" className="fill-card" />
          <rect x="70" y={84 + i * 34} width="54" height="5" rx="2.5" className="fill-pixel-off" />
          <circle cx="42" cy={87 + i * 34} r="7" className="fill-success-soft" />
          <Check x={42} y={87 + i * 34} />
        </g>
      ))}
      <rect x="118" y="14" width="186" height="172" rx="14" className="fill-card stroke-line-strong" />
      <circle cx="211" cy="44" r="14" className="fill-accent-soft" />
      <rect x="205" y="42" width="12" height="9" rx="2" className="fill-accent" />
      <path d="M207.5 42 v-3 a3.5 3.5 0 0 1 7 0 v3" fill="none" className="stroke-accent" strokeWidth="1.6" />
      <text x="211" y="76" direction="rtl" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-fg">{a.login}</text>
      <rect x="134" y="86" width="154" height="26" rx="8" className="fill-card stroke-line-strong" />
      <text x="144" y="103" fontFamily={mono} fontSize="10" className="fill-fg-2">test@myshop.ir</text>
      <rect x="134" y="118" width="154" height="26" rx="8" className="fill-card stroke-line-strong" />
      {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={146 + i * 9} cy="131" r="2.5" className="fill-fg-2" />)}
      <rect x="134" y="152" width="154" height="24" rx="8" className="fill-accent" />
      <text x="211" y="168" direction="rtl" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{a.login}</text>
      <rect x="232" y="22" width="64" height="18" rx="9" className="fill-success-soft" />
      <text x="264" y="34.5" direction="rtl" textAnchor="middle" fontSize="9" className="fill-success">{a.testAccount}</text>
    </svg>
  );
}

/** Sharing: a public report link with a copy button, opened by people without an account. */
function ShareArt({ a }: { a: FeatureArt }) {
  return (
    <svg viewBox="0 0 320 200" direction="ltr" className="h-full w-full" aria-hidden>
      <rect x="40" y="70" width="240" height="116" rx="14" className="fill-card stroke-line-strong" />
      <rect x="56" y="88" width="40" height="18" rx="9" className="fill-danger-soft" />
      <circle cx="66" cy="97" r="2.5" className="fill-danger" />
      <text x="264" y="101" direction="rtl" fontSize="11.5" fontWeight="700" className="fill-fg">{a.bugCount}</text>
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x="56" y={116 + i * 28} width="208" height="20" rx="6" className="fill-shell" />
          <rect x="140" y={123.5 + i * 28} width="114" height="5" rx="2.5" className="fill-pixel-off" />
          <rect x="62" y={121 + i * 28} width="26" height="10" rx="3" className={i ? "fill-warning-soft" : "fill-danger-soft"} />
        </g>
      ))}
      <rect x="20" y="14" width="280" height="40" rx="20" className="fill-card stroke-line-strong" />
      <g transform="translate(34 25) scale(0.75)" fill="none" className="stroke-fg-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </g>
      <text x="58" y="38" fontFamily={mono} fontSize="11" className="fill-fg">qagent.ir/share/x7k2</text>
      <rect x="234" y="20" width="60" height="28" rx="14" className="fill-fg" />
      <text x="264" y="38" direction="rtl" textAnchor="middle" fontSize="10.5" fontWeight="700" className="fill-card">{a.copy}</text>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={250 - i * 16} cy="72" r="11" className={["fill-accent-soft", "fill-success-soft", "fill-warning-soft"][i]} stroke="var(--bg-card)" strokeWidth="2.5" />
          <circle cx={250 - i * 16} cy="69" r="3.5" className={["fill-accent", "fill-success", "fill-warning"][i]} />
          <path d={`M${244 - i * 16} 78 a6 5 0 0 1 12 0`} className={["fill-accent", "fill-success", "fill-warning"][i]} />
        </g>
      ))}
      <rect x="100" y="62" width="112" height="20" rx="10" className="fill-success-soft" />
      <Check x={200} y={72} />
      <text x="192" y="76" direction="rtl" fontSize="9.5" className="fill-success">{a.noAccount}</text>
    </svg>
  );
}

export function Features() {
  const t = useTranslations("landing.features");
  const items = t.raw("items") as Item[];
  const a = t.raw("art") as FeatureArt;
  const arts = [
    <LiveArt key="live" a={a} />, <EvidenceArt key="evidence" />, <ScenariosArt key="scenarios" a={a} />,
    <ReplayArt key="replay" a={a} />, <LoginArt key="login" a={a} />, <ShareArt key="share" a={a} />,
  ];
  return (
    <Section id="features" tone="surface">
      <div data-reveal className="max-w-2xl">
        <p className="inline-flex rounded-full border border-line bg-card px-3 py-1 text-sm text-fg-2">{t("eyebrow")}</p>
        <h2 className="mt-5 text-[clamp(24px,2.6vw,34px)] leading-[1.3] font-bold text-balance">
          {t.rich("title", { hl: (c) => <span className="text-accent">{c}</span> })}
        </h2>
        <p className="mt-3 text-pretty text-fg-2">{t("subtitle")}</p>
      </div>
      <ul className="mt-12 grid gap-1.5 rounded-[28px] border border-line bg-fg/[0.03] p-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => (
          <li key={it.title} data-reveal style={stagger(i % 3)} className="flex flex-col overflow-hidden rounded-[22px] bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:p-6">
            <h3 className="text-lg font-bold">{it.title}</h3>
            <p className="mt-2 text-sm leading-[1.9] text-fg-2">{it.body}</p>
            <div className="mt-auto aspect-[8/5] pt-6">{arts[i]}</div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ReportShowcase() {
  const t = useTranslations("landing.report");
  return (
    <Section>
      <div data-reveal className="max-w-2xl">
        <p className="inline-flex rounded-full border border-line bg-card px-3 py-1 text-sm text-fg-2">{t("eyebrow")}</p>
        <h2 className="mt-5 text-[clamp(24px,2.6vw,34px)] leading-[1.3] font-bold text-balance">
          {t.rich("title", { hl: (c) => <span className="text-accent">{c}</span> })}
        </h2>
        <p className="mt-3 text-pretty text-fg-2">{t("subtitle")}</p>
      </div>
      <ReportFormats d={t.raw("doc") as ReportDoc} formats={t.raw("formats") as Item[]} label={t("formatsLabel")} />
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
