"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { addToCart, formatPrice, products } from "@/lib/shop";
import { Icon, ProductArt } from "../../ui";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const [added, setAdded] = useState(false);
  if (!product) notFound();

  return (
    <>
      <Link href="/" className="back"><Icon name="arrow" size={16} />همه محصولات</Link>
      <div className="product-page">
        <ProductArt product={product} size={120} />
        <div className="product-info">
          <span className="tag static">{product.tag}</span>
          <h1>{product.name}</h1>
          <p className="muted">{product.description}</p>
          <p className="price big">{formatPrice(product.price)}</p>
          <button className="btn" onClick={() => { addToCart(product.id); setAdded(true); }}>
            <Icon name="bag" size={18} />افزودن به سبد
          </button>
          {added && (
            <p role="status" className="notice">
              <Icon name="check" size={18} />به سبد اضافه شد
              <Link href="/cart">مشاهده سبد</Link>
            </p>
          )}
          <ul className="perks">
            <li>ارسال رایگان برای خرید بالای ۱ میلیون تومان</li>
            <li>۷ روز ضمانت بازگشت کالا</li>
          </ul>
        </div>
      </div>
    </>
  );
}
