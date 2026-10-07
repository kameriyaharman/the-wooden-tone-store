"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Check, Heart, LayoutGrid, Minus, Plus, Box, Home, ShoppingCart, Tag, Trash2, Truck, User, X, ArrowRight } from "lucide-react";
import { useStore } from "./store-provider";
import { WhatsappIcon } from "./icons";
import { inr } from "@/lib/format";

export function QtyStepper({ value, onChange, max = 99, small }: { value: number; onChange: (n: number) => void; max?: number; small?: boolean }) {
  const h = small ? "h-8" : "h-10";
  return (
    <div className={`inline-flex ${h} items-center rounded-lg border border-line bg-white`}>
      <button type="button" aria-label="Decrease" className="grid h-full w-8 place-items-center text-muted hover:text-ink disabled:opacity-40" disabled={value <= 1} onClick={() => onChange(value - 1)}><Minus className="h-3.5 w-3.5" /></button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button type="button" aria-label="Increase" className="grid h-full w-8 place-items-center text-muted hover:text-ink disabled:opacity-40" disabled={value >= max} onClick={() => onChange(value + 1)}><Plus className="h-3.5 w-3.5" /></button>
    </div>
  );
}

export function FreeShipBar({ subtotal, freeAbove }: { subtotal: number; freeAbove: number }) {
  const unlocked = freeAbove <= 0 || subtotal >= freeAbove;
  const pct = freeAbove <= 0 ? 100 : Math.min(100, (subtotal / freeAbove) * 100);
  return (
    <div className="rounded-xl bg-tint px-4 py-3">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-teak-dark">
        <Truck className="h-4 w-4" />
        {unlocked ? "Yay! Your order qualifies for FREE delivery." : `Add ${inr(freeAbove - subtotal)} more for FREE delivery.`}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EADFCB]"><div className="h-full rounded-full bg-teak" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function CartDrawer({ freeAbove, loggedIn }: { freeAbove: number; loggedIn: boolean }) {
  const { drawer, setDrawer, items, setQty, remove, subtotal, count } = useStore();
  const pathname = usePathname();
  useEffect(() => setDrawer(false), [pathname, setDrawer]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDrawer]);
  if (!drawer) return null;
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal aria-label="Cart">
      <div className="absolute inset-0 bg-black/45" onClick={() => setDrawer(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold"><ShoppingCart className="h-5 w-5" /> Cart ({count})</h2>
          <button onClick={() => setDrawer(false)} aria-label="Close cart" className="p-1"><X className="h-5 w-5" /></button>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingCart className="h-10 w-10 text-line" />
            <p className="font-serif text-2xl">Your cart is empty</p>
            <p className="text-sm text-muted">Browse our handcrafted solid wood pieces.</p>
            <Link href="/shop" className="btn-gold mt-2">Start shopping <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <FreeShipBar subtotal={subtotal} freeAbove={freeAbove} />
              <ul className="mt-3 divide-y divide-line">
                {items.map((it) => (
                  <li key={it.key} className="flex gap-3 py-4">
                    <Link href={`/product/${it.slug}`}>{it.image && <img src={it.image} alt="" className="h-[72px] w-[72px] rounded-lg object-cover" />}</Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-2">
                        <Link href={`/product/${it.slug}`} className="line-clamp-2 flex-1 text-sm font-medium">{it.name}</Link>
                        <button onClick={() => remove(it.key)} aria-label="Remove" className="self-start text-sale"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      {(it.finish || it.size) && <p className="mt-0.5 text-xs text-muted">{[it.finish, it.size].filter(Boolean).join(" · ")}</p>}
                      <p className="mt-1 text-sm font-bold">{inr(it.price)}</p>
                      <div className="mt-2"><QtyStepper small value={it.qty} max={it.maxQty} onChange={(n) => setQty(it.key, n)} /></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-line bg-cream/60 px-5 py-4">
              <Link href="/cart" className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-[#DCCDB4] bg-white px-3 py-2.5 text-[13px] text-muted">
                <Tag className="h-4 w-4" /> Have a coupon? Apply it in your cart{loggedIn ? "" : ""}
              </Link>
              <div className="flex justify-between text-sm text-muted"><span>Subtotal</span><span className="text-ink">{inr(subtotal)}</span></div>
              <div className="mt-1 flex justify-between text-sm text-muted"><span>Shipping</span><span className="font-semibold text-stock">{freeAbove <= 0 || subtotal >= freeAbove ? "FREE" : "At checkout"}</span></div>
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-lg font-bold"><span>Total</span><span>{inr(subtotal)}</span></div>
              <div className="mt-4 grid grid-cols-[1fr_1.4fr] gap-3">
                <Link href="/cart" className="btn-outline">View Cart</Link>
                <Link href="/checkout" className="btn-gold">Checkout <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 lg:bottom-8">
      <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium shadow-xl ring-1 ring-line">
        <Check className="h-4 w-4 text-stock" /> {toast}
      </div>
    </div>
  );
}

export function WhatsAppFab({ number }: { number: string }) {
  return (
    <a href={`https://wa.me/${number}`} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
      className="fixed bottom-20 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 lg:bottom-8 lg:right-8">
      <WhatsappIcon className="h-7 w-7" />
    </a>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { wishlist, ready } = useStore();
  const items = [
    { href: "/", label: "Home", icon: Home, on: pathname === "/" },
    { href: "/categories", label: "Categories", icon: LayoutGrid, on: pathname.startsWith("/categories") },
    { href: "/shop", label: "Shop", icon: Box, on: pathname.startsWith("/shop") },
    { href: "/wishlist", label: "Wishlist", icon: Heart, on: pathname.startsWith("/wishlist"), badge: ready ? wishlist.length : 0 },
    { href: "/account", label: "Account", icon: User, on: pathname.startsWith("/account") || pathname.startsWith("/login") },
  ];
  if (pathname.startsWith("/product/")) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`relative flex flex-col items-center gap-1 py-2 text-[11px] ${i.on ? "text-teak-dark" : "text-muted"}`}>
          <i.icon className="h-5 w-5" strokeWidth={1.6} />
          {i.label}
          {!!i.badge && <span className="absolute right-[28%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-teak px-1 text-[9px] font-bold text-white">{i.badge}</span>}
        </Link>
      ))}
    </nav>
  );
}
