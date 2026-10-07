"use client";
import { useEffect, useRef, useState } from "react";
import { Check, CreditCard, MapPin, ShoppingCart } from "lucide-react";
import { useStore, type CartItem } from "./store-provider";

export type Quote = {
  ok: boolean; error?: string;
  lines?: { productId: string; price: number; mrp: number; stock: number; finish: string | null; size: string | null }[];
  subtotal: number; mrpTotal: number; couponCode: string | null; couponDiscount: number; shipping: number; codFee: number; total: number;
};

export const COUPON_KEY = "twt_coupon";

export function getSavedCoupon() {
  try { return localStorage.getItem(COUPON_KEY) || ""; } catch { return ""; }
}
export function saveCoupon(c: string) {
  try { c ? localStorage.setItem(COUPON_KEY, c) : localStorage.removeItem(COUPON_KEY); } catch {}
}

/** Server-priced quote for the current cart. Keeps local cart prices in sync with the server. */
export function useQuote(coupon: string, method?: string) {
  const { items, replace, ready } = useStore();
  const [q, setQ] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const sig = JSON.stringify(items.map((i) => [i.productId, i.qty, i.finish, i.size])) + coupon + method;
  const last = useRef("");
  useEffect(() => {
    if (!ready || !items.length) { setQ(null); return; }
    if (last.current === sig) return;
    last.current = sig;
    setLoading(true);
    const ctl = new AbortController();
    fetch("/api/quote", { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map(({ productId, qty, finish, size }) => ({ productId, qty, finish, size })), coupon, method }) })
      .then((r) => r.json())
      .then((d: Quote) => {
        setQ(d);
        if (d.ok && d.lines) {
          let changed = false;
          const next: CartItem[] = items.map((it, idx) => {
            const l = d.lines![idx];
            if (l && (l.price !== it.price || l.mrp !== it.mrp || l.stock !== it.maxQty)) { changed = true; return { ...it, price: l.price, mrp: l.mrp, maxQty: l.stock }; }
            return it;
          });
          if (changed) { last.current = JSON.stringify(next.map((i) => [i.productId, i.qty, i.finish, i.size])) + coupon + method; replace(next); }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [sig, ready, items, coupon, method, replace]);
  return { q, loading };
}

export function Steps({ step }: { step: 1 | 2 | 3 }) {
  const items = [{ label: "Cart", Icon: ShoppingCart }, { label: "Address", Icon: MapPin }, { label: "Payment", Icon: CreditCard }];
  return (
    <div className="mx-auto flex max-w-md items-center justify-center">
      {items.map(({ label, Icon }, i) => {
        const n = i + 1;
        const done = n < step, cur = n === step;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${done ? "bg-ink text-white" : cur ? "bg-teak text-white" : "bg-[#F1E8DA] text-muted"}`}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className={`text-xs ${cur ? "font-semibold text-teak-dark" : "text-muted"}`}>{label}</span>
            </div>
            {n < 3 && <div className={`mx-2 mb-5 h-0.5 flex-1 ${done ? "bg-teak" : "bg-[#F1E8DA]"}`} />}
          </div>
        );
      })}
    </div>
  );
}
