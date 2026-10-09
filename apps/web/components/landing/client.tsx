"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Download, FileText, Hash, Link2, Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { LogoBox } from "@/components/brand/LogoBox";
import Link from "next/link";
import { btn } from "./ui";

/** Arms `[data-reveal]` elements and marks each with `data-in` the first time it scrolls into view. */
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-in])");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-in", "");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    document.documentElement.classList.add("reveal-armed");
    return () => io.disconnect();
  }, []);
  return null;
}

type NavLabels = Record<"features" | "how" | "pricing" | "faq" | "login" | "start" | "menu" | "close" | "home", string>;

export function Nav({ labels }: { labels: NavLabels }) {
  const [open, setOpen] = useState(false);
  // top: rides on the hero (dark, transparent) · in: fixed white bar · out: fixed bar sliding away before returning to top.
  const [bar, setBar] = useState<"top" | "in" | "out">("top");
  const closeRef = useRef<HTMLButtonElement>(null);
  const links = [
    ["#features", labels.features],
    ["#how", labels.how],
    ["#pricing", labels.pricing],
    ["#faq", labels.faq],
  ] as const;

  // Scrolls away with the hero; slides in as a fixed white bar once the hero is gone, slides out on the way back.
  useEffect(() => {
    const hero = document.querySelector("[data-hero]");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([e]) => setBar((b) => (!e.isIntersecting ? "in" : b === "in" ? "out" : b)),
      { rootMargin: "-64px 0px 0px 0px" },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header data-bar={bar}
        onTransitionEnd={(e) => e.target === e.currentTarget && bar === "out" && setBar("top")}
        className={`nav-bar inset-x-0 top-0 z-50 text-fg ${bar === "top" ? "theme-dark absolute" : "fixed border-b border-line-strong bg-canvas/80 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_20px_-10px_rgb(0_0_0/0.12)] backdrop-blur-xl"}`}
      >
        <nav aria-label="ناوبری اصلی" className="mx-auto grid h-16 w-full max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <Link href="/" aria-label={labels.home} className="group flex items-center gap-2 justify-self-start rounded-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <LogoBox size={26} />
            <span>کیوایجنت</span>
          </Link>
          <NavLinks links={links} />
          <Link href="/signin" className="inline-flex h-10 items-center justify-self-end rounded-full border border-line-strong bg-fg/[0.06] px-5 text-sm font-medium whitespace-nowrap text-fg transition-[transform,background-color,border-color] duration-150 ease-out hover:border-fg/30 hover:bg-fg/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.97] max-md:hidden">{labels.start}</Link>
          <button type="button" onClick={() => setOpen(true)} aria-label={labels.menu} aria-expanded={open} className={`${btn.ghost("sm")} col-start-3 justify-self-end rounded-full md:hidden`}>
            <Menu size={20} strokeWidth={1.5} />
          </button>
        </nav>
      </header>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={labels.menu} className="fixed inset-0 z-[60] flex flex-col bg-canvas p-4 md:hidden">
          <div className="flex items-center justify-between ps-4">
            <span className="flex items-center gap-2 font-semibold"><LogoBox size={26} />کیوایجنت</span>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={labels.close} className={`${btn.ghost("md")} rounded-full`}>
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
          <ul className="mt-10 flex flex-col gap-1 px-2">
            {links.map(([href, label], i) => (
              <li key={href} className="sheet-item" style={{ "--i": i } as React.CSSProperties}>
                <a href={href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 text-2xl font-semibold hover:bg-card focus-visible:outline-2 focus-visible:outline-accent">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-auto grid gap-2">
            <Link href="/signin" className={btn.primary("lg")}>{labels.start}</Link>
            <Link href="/signin" className={btn.secondary("lg")}>{labels.login}</Link>
          </div>
        </div>
      )}
    </>
  );
}

/** Center links with one shared hover highlight that slides between items; siblings recede while hovering. */
function NavLinks({ links }: { links: readonly (readonly [string, string])[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [pill, setPill] = useState({ x: 0, w: 0, snap: true });
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);

  function enter(i: number) {
    const el = refs.current[i];
    if (!el) return;
    // First hover snaps into place (fade only); later hovers slide from the previous item.
    setPill({ x: el.offsetLeft, w: el.offsetWidth, snap: active === null });
    setActive(i);
  }

  return (
    <div onMouseLeave={() => setActive(null)} data-hovering={active !== null || undefined}
      className="nav-links relative flex items-center max-md:hidden"
    >
      <span aria-hidden data-snap={pill.snap || undefined}
        className="nav-pill pointer-events-none absolute inset-y-0 left-0 rounded-full bg-fg/[0.06]"
        style={{ width: pill.w, transform: `translateX(${pill.x}px)`, opacity: active === null ? 0 : 1 }}
      />
      {links.map(([href, label], i) => (
        <a key={href} href={href} ref={(el) => { refs.current[i] = el; }}
          onMouseEnter={() => enter(i)} onFocus={() => enter(i)} onBlur={() => setActive(null)}
          data-active={active === i || undefined}
          className="nav-link relative rounded-full px-4 py-2 text-sm font-medium text-fg focus-visible:outline-2 focus-visible:outline-accent"
        >
          {label}
        </a>
      ))}
    </div>
  );
}

/** "Built for" carousel: photo cards in a horizontal scroller; the active card reveals body + CTA. */
export function AudienceCards({ items, labels }: {
  items: { title: string; body: string; image: string }[];
  labels: { cta: string; prev: string; next: string };
}) {
  const [active, setActive] = useState(0);
  const [edge, setEdge] = useState({ left: false, right: false });
  const track = useRef<HTMLUListElement>(null);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  // Which sides still have content to scroll to (direction-aware, so it works in RTL).
  const measure = () => {
    const el = track.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    const more = pos < max - 2;
    const back = pos > 2;
    setEdge({ left: rtl ? more : back, right: rtl ? back : more });
  };
  useEffect(() => {
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, []);

  const center = (i: number) => refs.current[i]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  const go = (i: number) => {
    const n = Math.max(0, Math.min(items.length - 1, i));
    setActive(n);
    center(n);
      };
  const arrow = "grid size-11 place-items-center rounded-full border border-line-strong text-fg transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-fg/5 active:scale-[0.95] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  return (
    <>
      <div className="flex gap-2 max-md:hidden">
        <button type="button" aria-label={labels.prev} disabled={active === 0} onClick={() => go(active - 1)} className={arrow}>
          <ArrowRight size={18} strokeWidth={1.5} />
        </button>
        <button type="button" aria-label={labels.next} disabled={active === items.length - 1} onClick={() => go(active + 1)} className={arrow}>
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
      </div>
      <div className="relative col-span-full mt-10 md:mt-12">
        <ul ref={track} onScroll={measure} className="audience-track flex snap-x snap-proximity gap-4 overflow-x-auto pb-2">
          {items.map((it, i) => (
            <li key={it.title} ref={(el) => { refs.current[i] = el; }} data-on={i === active || undefined}
              onClick={() => i !== active && go(i)}
              className="audience-card relative h-[420px] shrink-0 snap-center overflow-hidden rounded-3xl bg-shell md:h-[480px]"
            >
              <Image src={it.image} alt="" fill sizes="(min-width: 768px) 360px, 80vw" className="audience-photo object-cover" />
              <div aria-hidden className="audience-shade absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-7">
                <h3 className="text-2xl font-bold">{it.title}</h3>
                <div className="audience-more">
                  <div>
                    <p className="mt-3 max-w-[34ch] leading-[1.8] text-white/85">{it.body}</p>
                    <Link href="/signin" tabIndex={i === active ? 0 : -1}
                      className="mt-5 inline-flex h-12 items-center gap-3 rounded-full bg-white ps-5 pe-1.5 text-sm font-medium text-black transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {labels.cta}
                      <span className="grid size-9 place-items-center rounded-full bg-black text-white">
                        <ArrowUpRight size={16} strokeWidth={1.5} className="-scale-x-100" aria-hidden />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {(["left", "right"] as const).map((side) => (
          <span key={side} aria-hidden data-show={edge[side] || undefined}
            className={`audience-fade pointer-events-none absolute inset-y-0 w-8 md:w-14 ${side === "left" ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l"} from-canvas to-transparent`}
          />
        ))}
      </div>
    </>
  );
}

export type ReportDoc = {
  heading: string; goalLabel: string; goal: string; dateLabel: string; date: string; durationLabel: string; duration: string;
  scenariosLabel: string; scenarios: string; passed: string; bugs: string; high: string; bugTitle: string;
  expectedLabel: string; expected: string; actualLabel: string; actual: string; stepsLabel: string; steps: string[];
  screenshotsLabel: string; shots: string[]; technical: string; page: string; copy: string; download: string; share: string;
};

const formatIcons = [Link2, FileText, Hash];
const severityPill = "inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-medium text-danger before:size-1.5 before:rounded-full before:bg-current";

/** The report itself, shared by the link and PDF previews. `paper` tightens it to a printed page. */
function ReportBody({ d, paper = false }: { d: ReportDoc; paper?: boolean }) {
  const meta = [[d.dateLabel, d.date], [d.durationLabel, d.duration], [d.scenariosLabel, d.scenarios]];
  return (
    <div className={paper ? "space-y-4 text-[11px]" : "space-y-5 text-sm"}>
      <div className={`grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line`}>
        {meta.map(([k, v]) => (
          <div key={k} className={`bg-card ${paper ? "px-3 py-2" : "px-4 py-3"}`}>
            <p className="text-[11px] text-fg-3">{k}</p>
            <p className={`mt-0.5 font-bold ${paper ? "text-xs" : "text-base"}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
          <Check size={12} strokeWidth={2.5} aria-hidden />{d.passed}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-medium text-danger">
          <X size={12} strokeWidth={2.5} aria-hidden />{d.bugs}
        </span>
        <span className="text-xs text-fg-3">· {d.goalLabel}: {d.goal}</span>
      </div>

      <article className="rounded-2xl border border-line">
        <div className={`border-b border-line ${paper ? "p-3" : "p-4 md:p-5"}`}>
          <span className={severityPill}>{d.high}</span>
          <h4 className={`mt-2.5 font-bold ${paper ? "text-sm" : "text-base md:text-lg"}`}>{d.bugTitle}</h4>
        </div>
        <div className={`grid gap-px bg-line sm:grid-cols-2`}>
          {[[d.expectedLabel, d.expected, "text-success"], [d.actualLabel, d.actual, "text-danger"]].map(([k, v, tone]) => (
            <div key={k} className={`bg-card ${paper ? "p-3" : "p-4 md:p-5"}`}>
              <p className={`text-xs font-medium ${tone}`}>{k}</p>
              <p className="mt-1.5 leading-[1.8] text-fg-2">{v}</p>
            </div>
          ))}
        </div>
        <div className={`border-t border-line ${paper ? "p-3" : "p-4 md:p-5"}`}>
          <p className="text-xs font-medium text-fg-3">{d.stepsLabel}</p>
          <ol className="mt-3 space-y-2">
            {d.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-2.5">
                <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${i === d.steps.length - 1 ? "bg-danger-soft text-danger" : "bg-shell text-fg-2"}`}>
                  {(i + 1).toLocaleString("fa-IR")}
                </span>
                <span className="leading-[1.7] text-fg-2">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className={`border-t border-line ${paper ? "p-3" : "p-4 md:p-5"}`}>
          <p className="text-xs font-medium text-fg-3">{d.screenshotsLabel}</p>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {d.shots.map((label, i) => (
              <li key={label}>
                <div aria-hidden className={`relative aspect-[4/3] overflow-hidden rounded-lg border bg-shell p-2 ${i === 1 ? "border-danger/40" : "border-line"}`}>
                  {i < 2 ? (
                    <>
                      <div className="h-1.5 w-2/5 rounded-full bg-pixel-off" />
                      {[0, 1].map((r) => (
                        <div key={r} className="mt-1.5 flex items-center gap-1 rounded bg-card p-1">
                          <div className="h-2 w-1/2 rounded-full bg-pixel-off" />
                          <div className={`ms-auto h-2.5 w-4 rounded-sm border ${i === 1 && r === 0 ? "border-danger" : "border-line-strong"}`} />
                        </div>
                      ))}
                      {i === 1 && <span className="absolute end-1 top-4 size-6 rounded-md border border-dashed border-danger" />}
                    </>
                  ) : (
                    <div dir="ltr" className="space-y-1 font-mono text-[8px] leading-none">
                      <p className="text-success">200 GET /cart</p>
                      <p className="rounded-sm bg-danger-soft px-0.5 py-0.5 text-danger">500 DELETE</p>
                      <p className="text-success">200 GET /cart</p>
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-fg-3">{label}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className={`border-t border-line ${paper ? "p-3" : "p-4 md:p-5"}`}>
          <p className="text-xs font-medium text-fg-3">{d.technical}</p>
          <pre dir="ltr" className="mt-2.5 overflow-x-auto rounded-lg bg-shell px-3 py-2.5 font-mono text-[11px] leading-6 text-fg-2">
            <span className="text-danger">DELETE /api/cart/12 → 500 Internal Server Error</span>{"\n"}
            <span className="text-danger">console.error</span> Failed to remove item{"\n"}
            GET /api/cart → 200 (item still present)
          </pre>
        </div>
      </article>
    </div>
  );
}

/** Markdown export, shown as the file a developer would paste into an issue. */
function MarkdownView({ d }: { d: ReportDoc }) {
  const lines: [string, "h1" | "h2" | "h3" | "kv" | "li" | "code" | "blank" | "text", string?][] = [
    [`# ${d.heading} · myshop.ir`, "h1"],
    ["", "blank"],
    [`${d.goalLabel}:`, "kv", d.goal],
    [`${d.durationLabel}:`, "kv", `${d.duration} · ${d.passed} · ${d.bugs}`],
    ["", "blank"],
    [`## [${d.high}] ${d.bugTitle}`, "h2"],
    ["", "blank"],
    [`${d.expectedLabel}:`, "kv", d.expected],
    [`${d.actualLabel}:`, "kv", d.actual],
    ["", "blank"],
    [`### ${d.stepsLabel}`, "h3"],
    ...d.steps.map((step, i) => [`${i + 1}. ${step}`, "li"] as [string, "li"]),
    ["", "blank"],
    [`### ${d.technical}`, "h3"],
    ["```", "code"],
    ["DELETE /api/cart/12 → 500", "code"],
    ["```", "code"],
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <span dir="ltr" className="font-mono text-xs text-fg-2">qagent-report.md</span>
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line-strong px-3 text-xs text-fg-2">
          <Copy size={12} strokeWidth={1.75} aria-hidden />{d.copy}
        </span>
      </div>
      <ol className="flex-1 overflow-hidden py-3 font-mono text-[12.5px] leading-7">
        {lines.map(([text, kind, value], i) => (
          <li key={i} className="flex gap-4 px-4">
            <span dir="ltr" className="w-5 shrink-0 select-none text-end text-fg-3/70">{i + 1}</span>
            {kind === "blank" ? <span>&nbsp;</span>
              : kind === "code" ? <span dir="ltr" className="text-danger">{text}</span>
              : kind === "kv" ? <span><span className="font-bold text-fg">**{text}**</span> <span className="text-fg-2">{value}</span></span>
              : kind === "li" ? <span className="text-fg-2"><span className="text-accent">{text.split(" ")[0]}</span> {text.split(" ").slice(1).join(" ")}</span>
              : <span className={`font-bold ${kind === "h1" ? "text-fg" : kind === "h2" ? "text-accent" : "text-fg-2"}`}>{text}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Report showcase: pick a format on the side, see exactly what that export looks like. */
export function ReportFormats({ d, formats, label }: { d: ReportDoc; formats: { title: string; body: string }[]; label: string }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKeyDown(e: KeyboardEvent) {
    const dir = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const next = (active + dir + formats.length) % formats.length;
    setActive(next);
    refs.current[next]?.focus();
  }
  const action = "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium";
  return (
    <div className="mt-12 grid gap-1.5 rounded-[28px] border border-line bg-fg/[0.03] p-1.5 lg:grid-cols-[300px_1fr]">
      <div role="tablist" aria-label={label} aria-orientation="vertical" onKeyDown={onKeyDown} className="flex flex-col gap-1.5">
        {formats.map((f, i) => {
          const Icon = formatIcons[i];
          const on = i === active;
          return (
            <button key={f.title} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${id}-tab-${i}`}
              aria-selected={on} aria-controls={`${id}-panel`} tabIndex={on ? 0 : -1} onClick={() => setActive(i)}
              className={`group flex flex-1 items-start gap-3.5 rounded-[22px] p-5 text-start transition-[background-color,box-shadow] duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${on ? "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]" : "hover:bg-card/60"}`}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors duration-200 ${on ? "bg-accent text-on-accent" : "bg-card text-fg-2 ring-1 ring-line"}`}>
                <Icon size={18} strokeWidth={1.75} aria-hidden />
              </span>
              <span>
                <span className={`block font-bold transition-colors duration-200 ${on ? "text-fg" : "text-fg-2"}`}>{f.title}</span>
                <span className="mt-1 block text-sm leading-[1.8] text-fg-3">{f.body}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${active}`}
        className="relative h-[620px] overflow-hidden rounded-[22px] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
      >
        <div key={active} className="animate-rise h-full">
          {active === 0 && (
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
                <span className="flex gap-1.5" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-pixel-off" />)}</span>
                <span dir="ltr" className="mx-auto flex min-w-0 items-center gap-1.5 truncate rounded-full bg-shell px-3 py-1 font-mono text-xs text-fg-2">
                  <Link2 size={12} strokeWidth={1.75} aria-hidden className="shrink-0" />qagent.ir/share/x7k2
                </span>
                <span className={`${action} bg-fg text-canvas`}><Copy size={12} strokeWidth={1.75} aria-hidden />{d.copy}</span>
              </div>
              <div className="flex-1 overflow-hidden p-5 md:p-7">
                <div className="mb-5 flex items-center gap-2.5">
                  <LogoBox size={22} />
                  <span className="font-bold">{d.heading}</span>
                  <span dir="ltr" className="font-mono text-xs text-fg-3">myshop.ir</span>
                </div>
                <ReportBody d={d} />
              </div>
            </div>
          )}
          {active === 1 && (
            <div className="flex h-full flex-col bg-shell">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-card px-4 py-2.5">
                <span className="flex items-center gap-2 text-xs text-fg-2">
                  <span className="grid h-6 place-items-center rounded bg-danger px-1.5 text-[10px] font-bold text-white">PDF</span>
                  <span dir="ltr" className="font-mono">qagent-report.pdf</span>
                </span>
                <span className={`${action} bg-fg text-canvas`}><Download size={12} strokeWidth={1.75} aria-hidden />{d.download}</span>
              </div>
              <div className="flex-1 overflow-hidden px-4 pt-6 sm:px-10">
                <div className="mx-auto max-w-[520px] rounded-t-md bg-card px-7 pt-7 pb-10 shadow-[0_1px_3px_rgb(0_0_0/0.08),0_12px_32px_-12px_rgb(0_0_0/0.18)]">
                  <div className="mb-5 flex items-center justify-between border-b-2 border-fg pb-3">
                    <span className="flex items-center gap-2"><LogoBox size={18} /><span className="text-sm font-bold">{d.heading}</span></span>
                    <span className="text-[10px] text-fg-3">{d.page}</span>
                  </div>
                  <ReportBody d={d} paper />
                </div>
              </div>
            </div>
          )}
          {active === 2 && <MarkdownView d={d} />}
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
      </div>
    </div>
  );
}

/** Segmented control with a sliding active pill. Arrow keys move between options (tabs pattern). */
function Segmented({ options, value, onChange, label, idBase }: {
  options: string[];
  value: number;
  onChange: (i: number) => void;
  label: string;
  idBase: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKeyDown(e: KeyboardEvent) {
    const dir = { ArrowRight: -1, ArrowLeft: 1 }[e.key];
    if (!dir) return;
    const next = (value + dir + options.length) % options.length;
    onChange(next);
    refs.current[next]?.focus();
  }
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown}
      className="relative inline-grid rounded-full border border-line bg-shell p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span aria-hidden className="absolute inset-y-1 start-1 rounded-full bg-card-hover transition-transform duration-[250ms] ease-[var(--ease-out)]"
        style={{ width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${-value * 100}%)` }}
      />
      {options.map((o, i) => (
        <button key={o} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${idBase}-tab-${i}`}
          aria-selected={i === value} aria-controls={`${idBase}-panel`} tabIndex={i === value ? 0 : -1} onClick={() => onChange(i)}
          className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent ${i === value ? "text-fg" : "text-fg-3 hover:text-fg-2"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

type Plan = { name: string; desc: string; monthly: string; yearly: string; features: string[]; cta: string };

export function Pricing({ plans, labels, header }: {
  plans: Plan[];
  header: ReactNode;
  labels: { period: string; monthly: string; yearly: string; perMonth: string; billedYearly: string; popular: string; includes: string };
}) {
  const [period, setPeriod] = useState(0);
  const id = useId();
  return (
    <>
      <div data-reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        {header}
        <Segmented options={[labels.monthly, labels.yearly]} value={period} onChange={setPeriod} label={labels.period} idBase={id} />
      </div>
      <ul id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${period}`}
        className="mt-12 grid gap-1.5 rounded-[28px] border border-line bg-fg/[0.03] p-1.5 md:grid-cols-3"
      >
        {plans.map((p, i) => {
          const pro = i === 1;
          const free = i === 0;
          return (
            <li key={p.name} data-reveal style={{ "--i": i } as React.CSSProperties}
              className={`flex flex-col rounded-[22px] p-6 md:p-7 ${pro ? "theme-dark bg-canvas text-fg shadow-[0_20px_40px_-20px_rgb(0_0_0/0.45)]" : "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold">{p.name}</h3>
                {pro && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-white">{labels.popular}</span>}
              </div>
              <p className="mt-1.5 text-sm text-fg-2">{p.desc}</p>
              <div className="mt-8 flex items-baseline gap-1.5">
                <span key={period} className="animate-rise text-3xl font-bold md:text-[34px]">{period ? p.yearly : p.monthly}</span>
                <span className="text-sm text-fg-3">{labels.perMonth}</span>
              </div>
              <p className={`mt-1.5 h-5 text-xs text-fg-3 transition-opacity duration-200 ${period && !free ? "opacity-100" : "opacity-0"}`}>{labels.billedYearly}</p>
              <Link href="/signin"
                className={`mt-6 inline-flex h-11 items-center justify-center rounded-full text-sm font-medium transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${pro ? "bg-accent text-white hover:bg-accent-hover" : "border border-line-strong text-fg hover:bg-fg/5"}`}
              >
                {p.cta}
              </Link>
              <div className="mt-7 border-t border-line pt-6">
                <p className="text-xs font-medium text-fg-3">{labels.includes}</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-fg-2">
                      <span className={`grid size-5 shrink-0 place-items-center rounded-full ${pro ? "bg-accent text-white" : "bg-accent-soft text-accent"}`}>
                        <Check size={12} strokeWidth={2.5} aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
