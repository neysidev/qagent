"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { addToCart, formatPrice, products } from "@/lib/shop";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const [added, setAdded] = useState(false);
  if (!product) notFound();

  return (
    <div className="card">
      <div className="thumb" style={{ maxWidth: 360 }}>🛍️</div>
      <h1>{product.name} · {product.nameEn}</h1>
      <p>{product.description}</p>
      <p><strong>{formatPrice(product.price)}</strong></p>
      <button onClick={() => { addToCart(product.id); setAdded(true); }}>افزودن به سبد · Add to cart</button>
      {added && <p role="status">به سبد اضافه شد · Added to cart — <Link href="/cart">مشاهده سبد · View cart</Link></p>}
    </div>
  );
}
