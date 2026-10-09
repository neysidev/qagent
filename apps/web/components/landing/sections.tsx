import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";
import { LogoBox } from "@/components/brand/LogoBox";
import Image from "next/image";
import Link from "next/link";
import agent from "@/public/hero-agent.webp";
import { AudienceCards, Pricing, ReportFormats, type ReportDoc } from "./client";
import { container } from "./ui";

type Item = { title: string; body: string };
const stagger = (i: number) => ({ "--i": i }) as CSSProperties;

function Section({ id, tone = "canvas", children }: { id?: string; tone?: "canvas" | "surface"; children: ReactNode }) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-line py-24 md:py-32 ${tone === "surface" ? "bg-surface" : "bg-canvas"}`}>
      <div className={container}>{children}</div>
    </section>
  );
}

/** Section heading: rounded badge, title with an optional orange <hl> span, subtitle. */
function SectionHeading({ ns }: { ns: string }) {
  const t = useTranslations(ns);
  return (
    <>
      <p className="inline-flex rounded-full border border-line bg-card px-3 py-1 text-sm text-fg-2">{t("eyebrow")}</p>
      <h2 className="mt-5 text-[clamp(24px,2.6vw,34px)] leading-[1.3] font-bold text-balance">
        {t.rich("title", { hl: (c) => <span className="text-accent">{c}</span> })}
      </h2>
      <p className="mt-3 text-pretty text-fg-2">{t("subtitle")}</p>
    </>
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

export function BuiltFor() {
  const t = useTranslations("landing.builtFor");
  const items = t.raw("items") as Item[];
  return (
    <section className="scroll-mt-20 border-t border-line bg-canvas py-24 md:py-32">
      <div className={`${container} grid grid-cols-[1fr_auto] items-end gap-6`}>
        <div data-reveal className="max-w-2xl">
          <SectionHeading ns="landing.builtFor" />
        </div>
        <AudienceCards items={items} labels={{ prev: t("prev"), next: t("next") }} />
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
        <SectionHeading ns="landing.problem" />
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
        <SectionHeading ns="landing.how" />
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
        <SectionHeading ns="landing.features" />
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
        <SectionHeading ns="landing.report" />
      </div>
      <ReportFormats d={t.raw("doc") as ReportDoc} formats={t.raw("formats") as Item[]} label={t("formatsLabel")} />
    </Section>
  );
}

export function PricingSection() {
  const t = useTranslations("landing.pricing");
  return (
    <Section id="pricing" tone="surface">
      <Pricing
        plans={t.raw("plans")}
        header={
          <div className="max-w-2xl">
            <SectionHeading ns="landing.pricing" />
          </div>
        }
        labels={{
          period: t("period"), monthly: t("monthly"), yearly: t("yearly"), perMonth: t("perMonth"),
          billedYearly: t("billedYearly"), popular: t("popular"), includes: t("includes"),
        }}
      />
    </Section>
  );
}

export function Faq() {
  const t = useTranslations("landing.faq");
  const items = t.raw("items") as { q: string; a: string }[];
  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-16">
        <div data-reveal className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading ns="landing.faq" />
        </div>
        <div className="flex flex-col gap-1.5 rounded-[28px] border border-line bg-fg/[0.03] p-1.5">
          {items.map((it, i) => (
            <details key={it.q} name="faq" open={i === 0} data-reveal style={stagger(i)}
              className="faq-item group rounded-[22px] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[22px] px-5 py-5 font-bold md:px-6 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                {it.q}
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-shell text-fg-2 transition-[background-color,color,transform] duration-300 ease-[var(--ease-out-strong)] group-open:rotate-45 group-open:bg-accent group-open:text-white">
                  <Plus size={16} strokeWidth={2} />
                </span>
              </summary>
              <p className="px-5 pb-6 text-sm leading-[2] text-pretty text-fg-2 md:px-6">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

/** Closing CTA: a light, centered panel so it stands apart from the dark footer below; the agent leads the eye down to the action. */
export function FinalCta() {
  const t = useTranslations("landing.cta");
  const h = useTranslations("landing.hero");
  return (
    <section className="bg-canvas pt-16 pb-24 md:pt-24 md:pb-36">
      <div className={container}>
        <div data-reveal className="relative overflow-hidden rounded-[32px] border border-line bg-surface px-6 pb-14 text-center sm:px-12 md:pb-20">
          <div aria-hidden className="hero-dots absolute inset-0" />
          <div aria-hidden className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_50%_60%_at_50%_30%,var(--accent-soft),transparent)]" />
          <div className="relative mx-auto w-full max-w-[320px]">
            <div aria-hidden className="hero-band absolute inset-x-[-40%] top-[30%] h-[42%]" />
            <Image src={agent} alt={h("imageAlt")} sizes="320px" className="hero-image relative w-full" />
          </div>
          <h2 className="relative mx-auto -mt-4 max-w-2xl text-[clamp(28px,3.6vw,46px)] leading-[1.25] font-bold text-balance">
            {t.rich("title", { hl: (c) => <span className="text-accent">{c}</span> })}
          </h2>
          <p className="relative mx-auto mt-4 max-w-md leading-[1.9] text-pretty text-fg-2">{t("subtitle")}</p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/signin" className="inline-flex h-12 items-center rounded-full bg-accent px-8 font-medium text-white shadow-[0_12px_32px_-10px_var(--accent)] transition-[transform,background-color] duration-150 ease-out hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97]">
              {t("start")}
            </Link>
            <a href="#pricing" className="inline-flex h-12 items-center rounded-full border border-line-strong bg-card px-8 font-medium text-fg transition-[transform,background-color] duration-150 ease-out hover:bg-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97]">
              {t("pricing")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Skyline above the footer: a dev & QA scene — server rack, code editor, CI board, a bug under the
 * magnifier, a terminal run, a phone, the site under test with the agent's cursor, and a filed bug ticket. */
function FooterSkyline() {
  const ink = "fill-canvas";
  const cut = "#fff";
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
  const code = [[34, 52, 0], [22, 38, 1], [22, 70, 0], [34, 30, 1], [22, 56, 0], [34, 44, 0], [22, 26, 1]] as const;
  return (
    <svg viewBox="0 0 1200 140" preserveAspectRatio="xMidYMax slice" direction="ltr" className="block h-28 w-full md:h-[140px]" aria-hidden>
      {/* server rack */}
      <rect x="40" y="48" width="72" height="92" rx="6" className={ink} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x="48" y={56 + i * 16} width="56" height="11" rx="2" fill={cut} opacity="0.14" />
          {[0, 1, 2, 3].map((v) => <rect key={v} x={53 + v * 6} y={59 + i * 16} width="2.5" height="5" rx="1" fill={cut} opacity="0.7" />)}
          <circle cx="97" cy={61.5 + i * 16} r="2.4" className="fill-accent">
            <animate attributeName="opacity" values="1;0.2;1" dur={`${1.2 + i * 0.45}s`} repeatCount="indefinite" />
          </circle>
          <circle cx="90" cy={61.5 + i * 16} r="1.6" fill={cut} opacity="0.6" />
        </g>
      ))}
      <path d="M112 132 C122 132 124 136 134 136 H186" fill="none" className="stroke-canvas" strokeWidth="3" strokeLinecap="round" />

      {/* code editor monitor */}
      <rect x="130" y="22" width="172" height="92" rx="8" className={ink} />
      <rect x="138" y="30" width="156" height="76" rx="3" fill={cut} />
      <rect x="138" y="30" width="16" height="76" rx="3" className="fill-shell" />
      {code.map(([indent, w, hot], i) => (
        <g key={i}>
          <rect x="143" y={36 + i * 10} width="6" height="3" rx="1.5" className="fill-pixel-off" />
          <rect x={158 + indent - 22} y={35.5 + i * 10} width={w} height="4" rx="2" className={hot ? "fill-accent" : ink} opacity={hot ? 1 : 0.75} />
          {i % 2 === 0 && <rect x={158 + indent - 22 + w + 4} y={35.5 + i * 10} width={18} height="4" rx="2" className="fill-pixel-off" />}
        </g>
      ))}
      <rect x="226" y="95" width="2" height="7" className="fill-accent"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" /></rect>
      <rect x="208" y="114" width="16" height="18" className={ink} />
      <rect x="186" y="132" width="60" height="8" rx="3" className={ink} />

      {/* CI pipeline board */}
      <rect x="324" y="28" width="156" height="62" rx="8" className={ink} />
      <rect x="340" y="90" width="6" height="50" className={ink} />
      <rect x="458" y="90" width="6" height="50" className={ink} />
      <path d="M362 52 H442" stroke={cut} strokeWidth="2" opacity="0.5" />
      {[352, 402, 452].map((cx, i) => (
        <g key={cx}>
          <circle cx={cx} cy="52" r="10" className={i === 2 ? "fill-accent" : ""} fill={i === 2 ? undefined : cut} />
          {i < 2 ? (
            <path d={`M${cx - 4} 52 l3 3 l5.5 -6`} fill="none" className="stroke-canvas" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <circle cx={cx} cy="52" r="5" fill="none" stroke={cut} strokeWidth="2" strokeDasharray="20 12" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} 52`} to={`360 ${cx} 52`} dur="1.2s" repeatCount="indefinite" />
            </circle>
          )}
          <text x={cx} y="78" textAnchor="middle" fontFamily={mono} fontSize="9" fill={cut} opacity="0.85">{["build", "test", "deploy"][i]}</text>
        </g>
      ))}

      {/* magnifier over a bug */}
      <path d="M570 86 L600 136" className="stroke-canvas" strokeWidth="12" strokeLinecap="round" />
      <circle cx="548" cy="58" r="32" fill={cut} className="stroke-canvas" strokeWidth="9" />
      <path d="M528 44 a24 24 0 0 1 14 -10" fill="none" className="stroke-pixel-off" strokeWidth="3" strokeLinecap="round" />
      <g className="stroke-accent" strokeWidth="2.2" strokeLinecap="round">
        <path d="M539 56 l-8 -4 M539 63 l-9 1 M539 70 l-7 5 M557 56 l8 -4 M557 63 l9 1 M557 70 l7 5 M545 47 l-3 -6 M551 47 l3 -6" />
      </g>
      <ellipse cx="548" cy="63" rx="9" ry="12" className="fill-accent" />
      <circle cx="548" cy="49" r="5.5" className="fill-accent" />
      <path d="M548 53 v21" stroke={cut} strokeWidth="1.5" />

      {/* terminal */}
      <rect x="626" y="44" width="156" height="96" rx="8" className={ink} />
      {[640, 650, 660].map((cx) => <circle key={cx} cx={cx} cy="55" r="3" fill={cut} opacity="0.55" />)}
      <path d="M626 64 H782" stroke={cut} strokeOpacity="0.15" />
      <g fontFamily={mono} fontSize="10">
        <text x="638" y="82"><tspan className="fill-accent">$</tspan><tspan fill={cut}> qagent run</tspan></text>
        <text x="638" y="98" fill={cut} opacity="0.85">✓ 12 passed</text>
        <text x="638" y="114" className="fill-accent">✗ 1 failed</text>
      </g>
      <rect x="638" y="122" width="6" height="10" fill={cut}><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" /></rect>

      {/* phone */}
      <rect x="806" y="58" width="54" height="82" rx="10" className={ink} />
      <rect x="812" y="68" width="42" height="64" rx="4" fill={cut} />
      <rect x="826" y="62" width="14" height="3" rx="1.5" fill={cut} opacity="0.35" />
      <rect x="817" y="74" width="20" height="4" rx="2" className={ink} opacity="0.8" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x="817" y={84 + i * 14} width="32" height="10" rx="2" className="fill-shell" />
          <rect x="820" y={87 + i * 14} width="6" height="4" rx="1" className="fill-pixel-off" />
          <rect x="829" y={88 + i * 14} width="16" height="2.5" rx="1.25" className="fill-pixel-off" />
        </g>
      ))}
      <rect x="817" y="114" width="32" height="10" rx="5" className="fill-accent" />

      {/* site under test, with the agent's cursor on the CTA */}
      <rect x="884" y="12" width="222" height="128" rx="8" className={ink} />
      {[896, 906, 916].map((cx) => <circle key={cx} cx={cx} cy="24" r="3" fill={cut} opacity="0.6" />)}
      <rect x="930" y="19" width="160" height="10" rx="5" fill={cut} opacity="0.2" />
      <text x="1010" y="27" textAnchor="middle" fontFamily={mono} fontSize="7.5" fill={cut} opacity="0.85">myshop.ir</text>
      <rect x="892" y="36" width="206" height="104" fill={cut} />
      <rect x="900" y="44" width="22" height="6" rx="3" className={ink} />
      {[0, 1, 2].map((i) => <rect key={i} x={1040 + i * 18} y="45" width="12" height="4" rx="2" className="fill-pixel-off" />)}
      <rect x="900" y="62" width="104" height="7" rx="3.5" className={ink} />
      <rect x="900" y="74" width="80" height="7" rx="3.5" className={ink} />
      <rect x="900" y="88" width="96" height="3.5" rx="1.75" className="fill-pixel-off" />
      <rect x="900" y="95" width="70" height="3.5" rx="1.75" className="fill-pixel-off" />
      <rect x="900" y="106" width="52" height="14" rx="7" className="fill-accent" />
      <rect x="895" y="101" width="62" height="24" rx="10" fill="none" className="stroke-accent" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="1018" y="58" width="72" height="68" rx="6" className="fill-shell" />
      <path d="M1024 120 l18 -24 l12 14 l8 -9 l22 19 z" className="fill-pixel-off" />
      <circle cx="1072" cy="74" r="6" className="fill-pixel-off" />
      <path d="M944 112 l0 17 l4.5 -4.2 l3.2 7.4 l3 -1.3 l-3.2 -7.3 l6.2 -0.4 z" className="fill-accent stroke-canvas" strokeWidth="1.4" strokeLinejoin="round" />

      {/* filed bug ticket */}
      <rect x="1150" y="84" width="5" height="56" className={ink} />
      <rect x="1118" y="30" width="70" height="56" rx="6" className={ink} />
      <rect x="1118" y="30" width="70" height="13" rx="6" className="fill-accent" />
      <rect x="1118" y="37" width="70" height="6" className="fill-accent" />
      <text x="1126" y="40" fontFamily={mono} fontSize="8" fontWeight="700" className="fill-canvas">BUG-12</text>
      <rect x="1126" y="52" width="50" height="4" rx="2" fill={cut} opacity="0.8" />
      <rect x="1126" y="61" width="38" height="4" rx="2" fill={cut} opacity="0.45" />
      <rect x="1126" y="72" width="22" height="8" rx="4" fill={cut} opacity="0.2" />
    </svg>
  );
}

export function Footer() {
  const t = useTranslations("landing.footer");
  const n = useTranslations("landing.nav");
  const link = "rounded text-fg-2 transition-colors duration-150 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent";
  return (
    <footer className="theme-dark text-fg [color-scheme:dark]">
      <div className="bg-white">
        <FooterSkyline />
      </div>
      <div className="bg-canvas">
        <div aria-hidden className="footer-road h-1.5" />
        <div className={`${container} grid gap-12 pt-16 pb-10 md:grid-cols-[1.4fr_1fr_1fr_1.4fr]`}>
          <div>
            <p className="flex items-center gap-2.5 text-lg font-bold"><LogoBox size={30} />کیوایجنت</p>
            <p className="mt-4 max-w-xs text-sm leading-[1.9] text-fg-2">{t("tagline")}</p>
          </div>
          <nav aria-label={t("product")}>
            <p className="font-bold">{t("product")}</p>
            <ul className="mt-5 space-y-3 text-sm">
              {(["features", "how", "pricing", "faq"] as const).map((k) => (
                <li key={k}><a href={`#${k}`} className={link}>{n(k)}</a></li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t("start")}>
            <p className="font-bold">{t("start")}</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li><Link href="/signin" className={link}>{n("start")}</Link></li>
              <li><Link href="/signin" className={link}>{n("login")}</Link></li>
            </ul>
          </nav>
          <div>
            <p className="font-bold">{t("ready")}</p>
            <p className="mt-5 max-w-xs text-sm leading-[1.9] text-fg-2">{t("readyBody")}</p>
            <Link href="/signin" className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-medium text-white transition-[transform,background-color] duration-150 ease-out hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97]">
              {n("start")}
            </Link>
          </div>
        </div>
        <div className={`${container} flex flex-wrap justify-between gap-4 border-t border-line py-6 text-xs text-fg-3`}>
          <span>{t("rights")}</span>
          <span>{t("built")}</span>
        </div>
      </div>
    </footer>
  );
}
