"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bugsHeader, formatPrice, getCart, hasBug, products, setCart, type CartItem } from "@/lib/shop";

export default function CartPage() {
  const [cart, setLocal] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setLocal(getCart()), []);

  const save = (next: CartItem[]) => { setCart(next); setLocal(next); };

  function changeQty(id: string, raw: string) {
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    // B3: no lower bound, so 0 and negative quantities are accepted.
    const qty = hasBug("B3") ? n : Math.max(1, n);
    save(cart.map((i) => (i.id === id ? { ...i, qty } : i)));
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/cart/${id}`, { method: "DELETE", headers: { "x-qa-bugs": bugsHeader() } });
    // B1: the API returns 500 and the item silently stays in the cart.
    if (res.ok) save(cart.filter((i) => i.id !== id));
  }

  const rows = cart.map((i) => ({ ...i, product: products.find((p) => p.id === i.id)! })).filter((r) => r.product);
  const total = rows.reduce((s, r) => s + r.product.price * r.qty, 0);

  if (rows.length === 0)
    return <><h1>سبد خرید · Cart</h1><p>سبد خرید خالی است · Your cart is empty. <Link href="/">خرید · Shop</Link></p></>;

  return (
    <>
      <h1>سبد خرید · Cart</h1>
      <table>
        <thead><tr><th>محصول · Product</th><th>تعداد · Quantity</th><th>قیمت · Price</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.product.name} · {r.product.nameEn}</td>
              <td>
                <input
                  type="number"
                  aria-label={`Quantity ${r.product.nameEn}`}
                  min={hasBug("B3") ? undefined : 1}
                  value={r.qty}
                  onChange={(e) => changeQty(r.id, e.target.value)}
                  style={{ width: 80 }}
                />
              </td>
              <td>{formatPrice(r.product.price * r.qty)}</td>
              <td><button className="secondary" onClick={() => void remove(r.id)}>حذف · Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="error">{error}</p>}
      <p><strong>جمع کل · Total: {formatPrice(total)}</strong></p>
      <Link href="/checkout" className="btn">تسویه حساب · Checkout</Link>
    </>
  );
}
