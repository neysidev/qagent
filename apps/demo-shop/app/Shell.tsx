"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getCart, initBugs } from "@/lib/shop";
import { Icon } from "./ui";

const nav = [
  { href: "/", label: "محصولات" },
  { href: "/contact", label: "تماس" },
  { href: "/login", label: "ورود" },
  { href: "/signup", label: "ثبت‌نام" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [count, setCount] = useState(0);
  useEffect(() => {
    initBugs();
    const update = () => setCount(getCart().reduce((n, i) => n + Math.max(i.qty, 0), 0));
    update();
    window.addEventListener("cart", update);
    return () => window.removeEventListener("cart", update);
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <span className="brand-mark"><Icon name="bag" size={18} /></span>
            نیلا
            <span className="demo-badge">نمایشی</span>
          </Link>
          <nav aria-label="منوی اصلی">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined}>{n.label}</Link>
            ))}
          </nav>
          <Link href="/cart" className="cart-pill" aria-current={path === "/cart" ? "page" : undefined}>
            <Icon name="bag" size={18} />
            <span className="label-text">سبد خرید</span>
            <span className="count" key={count}>{count.toLocaleString("fa-IR")}</span>
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <p>نیلا یک فروشگاه نمایشی است و هیچ سفارش یا پرداختی انجام نمی‌شود</p>
      </footer>
    </>
  );
}
