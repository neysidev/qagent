"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { LogoBox } from "@/components/brand/LogoBox";
import Link from "next/link";
import { btn, card } from "./ui";

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

type UseCase = { label: string; pain: string; goal: string; outcome: string };

export function UseCaseTabs({ items, labels }: { items: UseCase[]; labels: { tabs: string; pain: string; goal: string; outcome: string } }) {
  const [i, setI] = useState(0);
  const id = useId();
  const item = items[i];
  return (
    <div className="flex flex-col items-center gap-8">
      <Segmented options={items.map((x) => x.label)} value={i} onChange={setI} label={labels.tabs} idBase={id} />
      <div key={i} id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${i}`}
        className={`${card} animate-rise grid w-full gap-6 p-6 md:grid-cols-3 md:p-8`}
      >
        <div>
          <p className="t-label text-fg-3">{labels.pain}</p>
          <p className="mt-3 text-fg-2">{item.pain}</p>
        </div>
        <div>
          <p className="t-label text-fg-3">{labels.goal}</p>
          <p className="mt-3 rounded-lg border border-line bg-shell p-3 font-mono text-sm text-fg">
            <span className="text-accent" aria-hidden>{"> "}</span>
            {item.goal}
          </p>
        </div>
        <div>
          <p className="t-label text-fg-3">{labels.outcome}</p>
          <p className="mt-3 text-fg-2">{item.outcome}</p>
        </div>
      </div>
    </div>
  );
}

type Plan = { name: string; desc: string; monthly: string; yearly: string; features: string[]; cta: string };

export function Pricing({ plans, labels }: {
  plans: Plan[];
  labels: { period: string; monthly: string; yearly: string; perMonth: string; billedYearly: string; popular: string };
}) {
  const [period, setPeriod] = useState(0);
  const id = useId();
  return (
    <div className="flex flex-col items-center gap-10">
      <Segmented options={[labels.monthly, labels.yearly]} value={period} onChange={setPeriod} label={labels.period} idBase={id} />
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${period}`} className="grid w-full gap-4 md:grid-cols-3">
        {plans.map((p, i) => {
          const pro = i === 1;
          return (
            <div key={p.name} data-reveal style={{ "--i": i } as React.CSSProperties}
              className={`relative flex flex-col rounded-xl border bg-card p-6 ${pro ? "border-accent" : "border-line"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-medium">{p.name}</h3>
                {pro && <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">{labels.popular}</span>}
              </div>
              <p className="mt-2 text-sm text-fg-2">{p.desc}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span key={period} className="animate-rise text-4xl font-semibold">{period ? p.yearly : p.monthly}</span>
                <span className="text-sm text-fg-3">{labels.perMonth}</span>
              </p>
              <p className={`mt-1 h-5 text-xs text-fg-3 transition-opacity duration-200 ${period && i ? "opacity-100" : "opacity-0"}`}>{labels.billedYearly}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-fg-2">
                    <Check size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-fg" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signin" className={`${pro ? btn.primary("md") : btn.secondary("md")} mt-8`}>{p.cta}</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
