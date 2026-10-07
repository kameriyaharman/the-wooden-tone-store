"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Headphones, Heart, Lock, RefreshCw, ShoppingCart, Tag, Trash2, Truck } from "lucide-react";
import { useStore } from "./store-provider";
import { FreeShipBar, QtyStepper } from "./cart-ui";
import { Steps, getSavedCoupon, saveCoupon, useQuote } from "./checkout-shared";
import { inr } from "@/lib/format";

export function CartPage({ freeAbove }: { freeAbove: number }) {
  const { items, setQty, remove, toggleWish, subtotal, ready } = useStore();
  const [coupon, setCoupon] = useState("");
  const [input, setInput] = useState("");
  useEffect(() => { const c = getSavedCoupon(); setCoupon(c); setInput(c); }, []);
  const { q, loading } = useQuote(coupon);
  const couponError = q && !q.ok && coupon ? q.error : null;
  const otherError = q && !q.ok && !coupon ? q.error : null;
  useEffect(() => { if (couponError) { saveCoupon(""); } }, [couponError]);

  if (!ready) return <div className="container-site py-24" />;
  if (!items.length)
    return (
      <div className="container-site py-20 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-line" />
        <h1 className="h-display mt-4 text-4xl">Your cart is empty</h1>
        <p className="mt-2 text-muted">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop" className="btn-gold mt-6">Start shopping <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );
  const mrpTotal = q?.ok ? q.mrpTotal : items.reduce((a, b) => a + b.mrp * b.qty, 0);
  const sub = q?.ok ? q.subtotal : subtotal;
  const cDisc = q?.ok ? q.couponDiscount : 0;
  const ship = q?.ok ? q.shipping : 0;
  const total = q?.ok ? q.total : subtotal;
  const count = items.reduce((a, b) => a + b.qty, 0);
  return (
    <div className="container-site py-8">
      <Steps step={1} />
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-5 md:p-6">
          <h1 className="font-serif text-3xl font-semibold">Your Cart ({count} items)</h1>
          <div className="mt-4"><FreeShipBar subtotal={sub} freeAbove={freeAbove} /></div>
          {otherError && <p className="mt-4 rounded-lg bg-[#FDECEE] p-3 text-sm text-sale">{otherError}</p>}
          <ul className="mt-2 divide-y divide-line">
            {items.map((it) => (
              <li key={it.key} className="flex gap-4 py-5">
                <Link href={`/product/${it.slug}`} className="shrink-0">{it.image && <img src={it.image} alt="" className="h-20 w-20 rounded-xl object-cover md:h-24 md:w-24" />}</Link>
                <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[1fr_auto]">
                  <div>
                    <Link href={`/product/${it.slug}`} className="text-[15px] font-medium hover:text-teak-dark">{it.name}</Link>
                    <p className="mt-0.5 text-xs text-muted">{[it.finish && `Finish: ${it.finish}`, it.size && `Size: ${it.size}`].filter(Boolean).join(" · ") || "Ships in 7–10 days"}</p>
                    <div className="mt-3"><QtyStepper small value={it.qty} max={it.maxQty} onChange={(n) => setQty(it.key, n)} /></div>
                  </div>
                  <div className="flex items-end justify-between gap-4 md:flex-col md:items-end">
                    <div className="text-left md:text-right">
                      <p className="font-bold">{inr(it.price * it.qty)}</p>
                      {it.mrp > it.price && <p className="text-xs text-muted line-through">{inr(it.mrp * it.qty)}</p>}
                    </div>
                    <div className="flex gap-3 text-xs text-muted">
                      <button onClick={() => { toggleWish({ productId: it.productId, slug: it.slug, name: it.name, image: it.image, price: it.price, mrp: it.mrp }); remove(it.key); }} className="flex items-center gap-1 hover:text-ink"><Heart className="h-3.5 w-3.5" /> Save</button>
                      <button onClick={() => remove(it.key)} className="flex items-center gap-1 hover:text-sale"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 lg:sticky lg:top-24">
          <div className="card p-5 md:p-6">
            <h2 className="font-serif text-3xl font-semibold">Order Summary</h2>
            <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const c = input.trim().toUpperCase(); setCoupon(c); saveCoupon(c); }}>
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter coupon code" className="input !border-dashed pl-9 uppercase placeholder:normal-case" />
              </div>
              <button className="btn-dark !px-5">Apply</button>
            </form>
            {couponError && <p className="mt-2 text-xs text-sale">{couponError}</p>}
            {q?.ok && q.couponCode && (
              <p className="mt-2 flex items-center justify-between text-xs text-stock">
                Coupon {q.couponCode} applied
                <button onClick={() => { setCoupon(""); setInput(""); saveCoupon(""); }} className="text-muted underline">Remove</button>
              </p>
            )}
            <dl className={`mt-5 space-y-2.5 text-sm transition ${loading ? "opacity-60" : ""}`}>
              <div className="flex justify-between"><dt className="text-muted">Total MRP</dt><dd>{inr(mrpTotal)}</dd></div>
              {mrpTotal > sub && <div className="flex justify-between"><dt className="text-muted">Discount on MRP</dt><dd className="text-stock">− {inr(mrpTotal - sub)}</dd></div>}
              {cDisc > 0 && <div className="flex justify-between"><dt className="text-muted">Coupon discount</dt><dd className="text-stock">− {inr(cDisc)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="font-semibold text-stock">{ship ? inr(ship) : "FREE"}</dd></div>
              <div className="flex justify-between border-t border-line pt-4 text-lg font-bold"><dt>Total</dt><dd>{inr(total)}</dd></div>
            </dl>
            {mrpTotal - total > 0 && <p className="mt-2 text-xs font-semibold text-stock">You save {inr(mrpTotal - total + ship)} on this order</p>}
            <Link href="/checkout" className={`btn-gold mt-5 w-full ${otherError ? "pointer-events-none opacity-50" : ""}`}>Proceed to Checkout <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/shop" className="btn-outline mt-2.5 w-full">Continue Shopping</Link>
          </div>
          <TrustRow />
        </div>
      </div>
    </div>
  );
}

export function TrustRow() {
  return (
    <div className="card grid grid-cols-4 overflow-hidden">
      {[[Lock, "Secure", "Payments"], [RefreshCw, "Easy", "Returns"], [Truck, "Free", "Shipping"], [Headphones, "24/7", "Support"]].map(([I, a, b], i) => {
        const Icon = I as typeof Lock;
        return (
          <div key={i} className="border-line p-3 text-center [&:not(:last-child)]:border-r">
            <Icon className="mx-auto h-4 w-4 text-teak" />
            <p className="mt-1 text-xs font-bold">{a as string}</p>
            <p className="text-[11px] text-muted">{b as string}</p>
          </div>
        );
      })}
    </div>
  );
}
