import Link from "next/link";
import { formatPrice, products } from "@/lib/shop";
import { ProductArt } from "./ui";

export default function Home() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">مجموعه پاییز</p>
        <h1>چیزهای کوچک برای روزهای آرام</h1>
        <p className="lead">ظرف‌های دست‌ساز، چای معطر و شمع، انتخاب شده برای خانه</p>
      </section>
      <h2 className="section-title">محصولات</h2>
      <div className="grid">
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className="product-card">
            <ProductArt product={p} />
            <span className="tag">{p.tag}</span>
            <div className="product-meta">
              <h3>{p.name}</h3>
              <p className="price">{formatPrice(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
