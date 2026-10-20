"use client";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useStore } from "./store-provider";
import { inr, pctOff } from "@/lib/format";
import type { CardProduct } from "@/lib/catalog";

export function Stars({ value, count, size = "h-3 w-3" }: { value: number; count?: number; size?: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className={`${size} ${i <= Math.round(value) ? "fill-teak text-teak" : "fill-[#E6DED2] text-[#E6DED2]"}`} />
        ))}
      </div>
      {count !== undefined && <span className="text-[11px] text-muted">({count})</span>}
    </div>
  );
}

export function SaleBadge({ price, mrp, className = "" }: { price: number; mrp: number; className?: string }) {
  const p = pctOff(price, mrp);
  if (!p) return null;
  return (
    <span className={`inline-flex items-center bg-sale px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white ${className}`}>
      {p}% off
    </span>
  );
}

export function ProductCard({ p, list = false }: { p: CardProduct; list?: boolean }) {
  const { add, toggleWish, inWish, ready } = useStore();
  const out = p.stock <= 0;
  const wished = ready && inWish(p.id);
  const img = p.images[0];
  const img2 = p.images[1];
  const addToCart = () => {
    add({ productId: p.id, slug: p.slug, name: p.name, image: img || null, price: p.price, mrp: p.mrp, qty: 1, maxQty: p.stock });
  };
  return (
    <div className={`group flex ${list ? "flex-row gap-5 border-b border-line pb-5" : "flex-col"}`}>
      <div className={`relative overflow-hidden bg-cream ${list ? "w-40 shrink-0 sm:w-56" : ""}`}>
        <Link href={`/product/${p.slug}`} className="block" data-cursor="view">
          {img ? (
            <>
              <img src={img} alt={p.name} loading="lazy" className={`aspect-[4/5] w-full object-cover transition duration-700 ${img2 ? "group-hover:opacity-0" : "group-hover:scale-[1.04]"}`} />
              {img2 && <img src={img2} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />}
            </>
          ) : (
            <div className="aspect-[4/5] w-full" />
          )}
        </Link>
        <SaleBadge price={p.price} mrp={p.mrp} className="absolute left-0 top-3" />
        <button
          onClick={() => toggleWish({ productId: p.id, slug: p.slug, name: p.name, image: img || null, price: p.price, mrp: p.mrp })}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink transition hover:text-sale"
        >
          <Heart className={`h-4 w-4 ${wished ? "fill-sale text-sale" : ""}`} strokeWidth={1.6} />
        </button>
        {out ? (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-white">Sold out</span>
        ) : !list && (
          <button
            onClick={addToCart}
            aria-label="Add to cart"
            className="absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full bg-ink/90 text-white transition duration-300 hover:bg-teak md:inset-x-0 md:bottom-0 md:right-auto md:flex md:h-auto md:w-auto md:translate-y-full md:items-center md:justify-center md:gap-2 md:rounded-none md:py-2.5 md:text-[11px] md:font-medium md:uppercase md:tracking-[0.18em] md:group-hover:translate-y-0"
          >
            <ShoppingBag className="h-4 w-4 md:h-3.5 md:w-3.5" /><span className="hidden md:inline">Add to cart</span>
          </button>
        )}
      </div>
      <div className={`flex flex-1 flex-col ${list ? "justify-center py-2" : "items-center px-1 pt-3.5 text-center"}`}>
        <Link href={`/product/${p.slug}`} className="line-clamp-2 text-[14px] leading-snug text-ink transition-colors hover:text-teak-dark sm:text-[15px]">
          {p.name}
        </Link>
        {p.ratingCount > 0 && <div className="mt-1.5"><Stars value={p.ratingAvg} count={p.ratingCount} /></div>}
        <div className={`mt-1.5 flex flex-wrap items-baseline gap-x-2 ${list ? "" : "justify-center"}`}>
          <span className="text-[15px] font-medium text-ink">{inr(p.price)}</span>
          {p.mrp > p.price && <span className="text-[13px] text-muted line-through">{inr(p.mrp)}</span>}
        </div>
        {list && !out && (
          <button onClick={addToCart} className="btn-dark btn-sm mt-4 self-start">
            <ShoppingBag className="h-3.5 w-3.5" /> Add to cart
          </button>
        )}
      </div>
    </div>
  );
}
