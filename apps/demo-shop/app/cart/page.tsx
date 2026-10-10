"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bugsHeader, formatPrice, getCart, hasBug, products, setCart, type CartItem } from "@/lib/shop";
import { Icon, ProductArt } from "../ui";

export default function CartPage() {
  const [cart, setLocal] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => { setLocal(getCart()); setReady(true); }, []);

  const save = (next: CartItem[]) => { setCart(next); setLocal(next); };

  function changeQty(id: string, raw: string) {
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    const qty = hasBug("B3") ? n : Math.max(1, n);
    save(cart.map((i) => (i.id === id ? { ...i, qty } : i)));
  }

  async function remove(id: string) {
    const res = await fetch(`/api/cart/${id}`, { method: "DELETE", headers: { "x-qa-bugs": bugsHeader() } });
    if (res.ok) save(cart.filter((i) => i.id !== id));
  }

  const rows = cart.map((i) => ({ ...i, product: products.find((p) => p.id === i.id)! })).filter((r) => r.product);
  const total = rows.reduce((s, r) => s + r.product.price * r.qty, 0);

  if (!ready) return null;
  if (rows.length === 0)
    return (
      <div className="empty">
        <span className="empty-icon"><Icon name="bag" size={28} /></span>
        <h1>سبد خرید خالی است</h1>
        <p className="muted">هنوز چیزی به سبد اضافه نکرده‌اید</p>
        <Link href="/" className="btn">دیدن محصولات</Link>
      </div>
    );

  return (
    <>
      <h1 className="page-title">سبد خرید</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {rows.map((r) => (
            <li key={r.id} className="cart-row">
              <div className="cart-thumb"><ProductArt product={r.product} size={28} /></div>
              <div className="cart-name">
                <Link href={`/product/${r.id}`}>{r.product.name}</Link>
                <span className="muted small">{formatPrice(r.product.price)}</span>
              </div>
              <label className="qty">
                <span className="sr-only">تعداد {r.product.name}</span>
                <input
                  type="number"
                  aria-label={`Quantity ${r.product.nameEn}`}
                  min={hasBug("B3") ? undefined : 1}
                  value={r.qty}
                  onChange={(e) => changeQty(r.id, e.target.value)}
                />
              </label>
              <span className="line-total">{formatPrice(r.product.price * r.qty)}</span>
              <button className="icon-btn" onClick={() => void remove(r.id)} aria-label={`حذف ${r.product.name}`} title="حذف">
                <Icon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ul>
        <aside className="summary">
          <div className="summary-row"><span className="muted">جمع کالاها</span><span>{formatPrice(total)}</span></div>
          <div className="summary-row"><span className="muted">ارسال</span><span>رایگان</span></div>
          <div className="summary-row total"><span>جمع کل</span><strong>{formatPrice(total)}</strong></div>
          <Link href="/checkout" className="btn block">تسویه حساب</Link>
        </aside>
      </div>
    </>
  );
}
