"use client";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingCart, Star, Zap } from "lucide-react";
import { useStore } from "./store-provider";
import { QtyStepper } from "./cart-ui";
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
    <span className={`inline-flex items-center gap-1 rounded-md bg-sale px-2 py-1 text-[10px] font-bold text-white ${className}`}>
      <Zap className="h-3 w-3 fill-white" /> -{p}%
    </span>
  );
}

export function ProductCard({ p, list = false }: { p: CardProduct; list?: boolean }) {
  const { add, toggleWish, inWish, ready } = useStore();
  const [qty, setQty] = useState(1);
  const out = p.stock <= 0;
  const wished = ready && inWish(p.id);
  const img = p.images[0];
  const addToCart = () => {
    add({ productId: p.id, slug: p.slug, name: p.name, image: img || null, price: p.price, mrp: p.mrp, qty, maxQty: p.stock });
  };
  return (
    <div className={`card group flex p-2 transition hover:shadow-card ${list ? "flex-row gap-4" : "flex-col"}`}>
      <div className={`relative overflow-hidden rounded-xl bg-cream ${list ? "w-40 shrink-0 sm:w-52" : ""}`}>
        <Link href={`/product/${p.slug}`} className="block">
          {img ? (
            <img src={img} alt={p.name} loading="lazy" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
          ) : (
            <div className="aspect-square w-full" />
          )}
        </Link>
        <SaleBadge price={p.price} mrp={p.mrp} className="absolute left-2 top-2" />
        <button
          onClick={() => toggleWish({ productId: p.id, slug: p.slug, name: p.name, image: img || null, price: p.price, mrp: p.mrp })}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow transition ${wished ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"}`}
        >
          <Heart className={`h-4 w-4 ${wished ? "fill-sale text-sale" : ""}`} />
        </button>
        {out && <span className="absolute inset-x-2 bottom-2 rounded-md bg-ink/80 py-1 text-center text-[11px] font-semibold text-white">Out of stock</span>}
      </div>
      <div className={`flex flex-1 flex-col ${list ? "py-2 pr-2" : "px-1 pb-1 pt-3"}`}>
        <Link href={`/product/${p.slug}`} className="line-clamp-2 min-h-[2.5em] text-[13px] font-medium leading-[1.25] text-ink hover:text-teak-dark sm:text-sm">
          {p.name}
        </Link>
        <div className="mt-1.5"><Stars value={p.ratingAvg} count={p.ratingCount} /></div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-bold sm:text-base">{inr(p.price)}</span>
          {p.mrp > p.price && <span className="text-xs text-muted line-through">{inr(p.mrp)}</span>}
        </div>
        <div className="mt-auto flex items-center gap-2 pt-3">
          <div className="hidden sm:block"><QtyStepper small value={qty} max={Math.max(1, p.stock)} onChange={setQty} /></div>
          <button onClick={addToCart} disabled={out} className="btn-gold btn-sm h-8 flex-1">
            <ShoppingCart className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
