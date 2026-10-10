import type { ReactNode } from "react";
import type { Product } from "@/lib/shop";

const paths: Record<string, ReactNode> = {
  mug: <><path d="M5 8h11v7a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" /><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" /><path d="M9 2.5c-.6.8-.6 1.7 0 2.5M12.5 2.5c-.6.8-.6 1.7 0 2.5" /></>,
  book: <><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v16H6.5A1.5 1.5 0 0 0 5 20.5z" /><path d="M5 20.5A1.5 1.5 0 0 0 6.5 22H19v-3" /><path d="M9 7.5h6" /></>,
  leaf: <><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z" /><path d="M5 19c3-4 6-7 10-10" /></>,
  flame: <><path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1 1.5 2 1.5 3 1-1.5 1.5-4 1.5-8z" /><path d="M8 21h8" /></>,
  bowl: <><path d="M3 11h18a9 9 0 0 1-18 0z" /><path d="M8 20h8" /><path d="M9 7c1-1.5 2-1.5 3 0s2 1.5 3 0" /></>,
  drip: <><path d="M4 6h16l-5 7H9z" /><path d="M10 13v2h4v-2" /><path d="M6 19h12" /><path d="M12 15v4" /></>,
  bag: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  arrow: <path d="M14 6l-6 6 6 6" />,
};

export function Icon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
}

/** Product "photo": a soft tinted tile with a large line icon, so the shop needs no image assets. */
export function ProductArt({ product, size = 56 }: { product: Product; size?: number }) {
  return (
    <div className="art" style={{ background: product.tone }}>
      <Icon name={product.icon} size={size} />
    </div>
  );
}
