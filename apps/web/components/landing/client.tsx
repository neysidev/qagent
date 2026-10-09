"use client";

import { Check, Menu, X } from "lucide-react";
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const links = [
    ["#features", labels.features],
    ["#how", labels.how],
    ["#pricing", labels.pricing],
    ["#faq", labels.faq],
  ] as const;

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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-shell/70 backdrop-blur-md">
        <nav aria-label="ناوبری اصلی" className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-1 px-4 sm:px-6">
          <Link href="/" aria-label={labels.home} className="group me-auto flex items-center gap-2 rounded-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            <LogoBox size={26} />
            <span>کیوایجنت</span>
          </Link>
          <div className="flex items-center gap-0.5 max-md:hidden">
            {links.map(([href, label]) => (
              <a key={href} href={href} className={btn.ghost("sm")}>{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-1 max-md:hidden">
            <Link href="/signin" className={btn.ghost("sm")}>{labels.login}</Link>
            <Link href="/signin" className={`${btn.primary("sm")}`}>{labels.start}</Link>
          </div>
          <button type="button" onClick={() => setOpen(true)} aria-label={labels.menu} aria-expanded={open} className={`${btn.ghost("sm")} rounded-full md:hidden`}>
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
