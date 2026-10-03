import Link from "next/link";
import { formatPrice, products } from "@/lib/shop";

export default function Home() {
  return (
    <>
      <h1>محصولات · Products</h1>
      <div className="grid">
        {products.map((p) => (
          <Link key={p.id} href={`/product/${p.id}`} className="card" style={{ color: "inherit", textDecoration: "none" }}>
            <div className="thumb">🛍️</div>
            <h3>{p.name} · {p.nameEn}</h3>
            <p>{formatPrice(p.price)}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
