"use client";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useStore } from "./store-provider";
import { inr } from "@/lib/format";
import { SaleBadge } from "./product-card";

export function WishlistPage() {
  const { wishlist, toggleWish, add, ready } = useStore();
  if (!ready) return <div className="min-h-[40vh]" />;
  if (!wishlist.length)
    return (
      <div className="py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-line" />
        <p className="mt-3 font-serif text-3xl">Your wishlist is empty</p>
        <p className="mt-1 text-sm text-muted">Tap the heart on any product to save it here.</p>
        <Link href="/shop" className="btn-gold mt-5">Browse products</Link>
      </div>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
      {wishlist.map((w) => (
        <div key={w.productId} className="card flex flex-col p-2">
          <div className="relative">
            <Link href={`/product/${w.slug}`}>{w.image && <img src={w.image} alt="" className="aspect-square w-full rounded-xl object-cover" />}</Link>
            <SaleBadge price={w.price} mrp={w.mrp} className="absolute left-2 top-2" />
            <button onClick={() => toggleWish(w)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow" aria-label="Remove"><Trash2 className="h-4 w-4 text-sale" /></button>
          </div>
          <Link href={`/product/${w.slug}`} className="mt-3 line-clamp-2 px-1 text-sm font-medium">{w.name}</Link>
          <p className="mt-1 px-1 font-bold">{inr(w.price)} {w.mrp > w.price && <span className="text-xs font-normal text-muted line-through">{inr(w.mrp)}</span>}</p>
          <button onClick={() => add({ productId: w.productId, slug: w.slug, name: w.name, image: w.image, price: w.price, mrp: w.mrp, qty: 1 })} className="btn-gold btn-sm mt-3"><ShoppingCart className="h-3.5 w-3.5" /> Move to cart</button>
        </div>
      ))}
    </div>
  );
}
