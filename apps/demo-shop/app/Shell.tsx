"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { getCart, initBugs } from "@/lib/shop";

export function Shell({ children }: { children: ReactNode }) {
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
      <header>
        <Link href="/" className="brand">☕ فروشگاه دمو · Demo Shop</Link>
        <Link href="/">محصولات · Products</Link>
        <Link href="/cart">سبد خرید · Cart ({count})</Link>
        <Link href="/contact">تماس · Contact</Link>
        <Link href="/login">ورود · Login</Link>
        <Link href="/signup">ثبت‌نام · Sign up</Link>
      </header>
      <main>{children}</main>
    </>
  );
}
