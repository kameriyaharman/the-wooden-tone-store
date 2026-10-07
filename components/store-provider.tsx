"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  mrp: number;
  qty: number;
  finish?: string | null;
  size?: string | null;
  maxQty?: number;
};

export type WishItem = { productId: string; slug: string; name: string; image: string | null; price: number; mrp: number };

type Ctx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  mrpTotal: number;
  add: (i: Omit<CartItem, "key">, openDrawer?: boolean) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  replace: (items: CartItem[]) => void;
  drawer: boolean;
  setDrawer: (v: boolean) => void;
  toast: string | null;
  showToast: (m: string) => void;
  wishlist: WishItem[];
  toggleWish: (w: WishItem) => void;
  inWish: (id: string) => boolean;
  ready: boolean;
};

const StoreCtx = createContext<Ctx | null>(null);
const CART_KEY = "twt_cart_v1";
const WISH_KEY = "twt_wish_v1";

const read = <T,>(k: string, fb: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fb;
  } catch {
    return fb;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(read<CartItem[]>(CART_KEY, []));
    setWishlist(read<WishItem[]>(WISH_KEY, []));
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setItems(read(CART_KEY, []));
      if (e.key === WISH_KEY) setWishlist(read(WISH_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (ready) write(CART_KEY, items);
  }, [items, ready]);
  useEffect(() => {
    if (ready) write(WISH_KEY, wishlist);
  }, [wishlist, ready]);

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const add = useCallback<Ctx["add"]>(
    (i, openDrawer = true) => {
      const key = [i.productId, i.finish || "", i.size || ""].join("|");
      setItems((prev) => {
        const ex = prev.find((x) => x.key === key);
        const max = i.maxQty ?? 99;
        if (ex) return prev.map((x) => (x.key === key ? { ...x, ...i, key, qty: Math.min(max, x.qty + i.qty) } : x));
        return [...prev, { ...i, key, qty: Math.min(max, i.qty) }];
      });
      if (openDrawer) setDrawer(true);
      showToast("Added to cart!");
    },
    [showToast],
  );
  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) => prev.map((x) => (x.key === key ? { ...x, qty: Math.max(1, Math.min(x.maxQty ?? 99, qty)) } : x)));
  }, []);
  const remove = useCallback((key: string) => setItems((prev) => prev.filter((x) => x.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);
  const replace = useCallback((next: CartItem[]) => setItems(next), []);
  const toggleWish = useCallback(
    (w: WishItem) => {
      setWishlist((prev) => {
        const has = prev.some((x) => x.productId === w.productId);
        showToast(has ? "Removed from wishlist" : "Saved to wishlist");
        return has ? prev.filter((x) => x.productId !== w.productId) : [w, ...prev];
      });
    },
    [showToast],
  );

  const value = useMemo<Ctx>(
    () => ({
      items,
      count: items.reduce((a, b) => a + b.qty, 0),
      subtotal: items.reduce((a, b) => a + b.price * b.qty, 0),
      mrpTotal: items.reduce((a, b) => a + Math.max(b.mrp, b.price) * b.qty, 0),
      add, setQty, remove, clear, replace, drawer, setDrawer, toast, showToast,
      wishlist, toggleWish, inWish: (id) => wishlist.some((w) => w.productId === id), ready,
    }),
    [items, add, setQty, remove, clear, replace, drawer, toast, showToast, wishlist, toggleWish, ready],
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
