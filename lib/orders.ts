import "server-only";
import { db, schema as s } from "./db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { getSettings } from "./settings";
import type { Finish, SizeOpt } from "./db/schema";

export type CartLineInput = { productId: string; qty: number; finish?: string | null; size?: string | null };

export type PricedLine = {
  productId: string; name: string; slug: string; image: string | null; qty: number;
  price: number; mrp: number; finish: string | null; size: string | null; stock: number;
};

export class CheckoutError extends Error {}

export async function priceLines(input: CartLineInput[]) {
  const ids = [...new Set(input.map((l) => l.productId))];
  if (!ids.length) throw new CheckoutError("Your cart is empty.");
  const rows = await db.select().from(s.products).where(and(inArray(s.products.id, ids), eq(s.products.active, true)));
  const map = new Map(rows.map((r) => [r.id, r]));
  const lines: PricedLine[] = [];
  for (const l of input) {
    const p = map.get(l.productId);
    if (!p) throw new CheckoutError("A product in your cart is no longer available. Please remove it and try again.");
    const qty = Math.max(1, Math.min(99, Math.floor(l.qty || 1)));
    const sizes = (p.sizes as SizeOpt[]) || [];
    const finishes = (p.finishes as Finish[]) || [];
    const size = sizes.find((x) => x.name === l.size) || (sizes.length ? sizes.find((x) => x.priceDelta === 0) || sizes[0] : undefined);
    const finish = finishes.find((x) => x.name === l.finish) || finishes[0];
    const delta = size?.priceDelta || 0;
    lines.push({
      productId: p.id, name: p.name, slug: p.slug, image: p.images[0] || null, qty,
      price: p.price + delta, mrp: Math.max(p.mrp + delta, p.price + delta),
      finish: finish?.name || null, size: size?.name || null, stock: p.stock,
    });
  }
  // stock check per product (sum across variants)
  const qtyByProduct = new Map<string, number>();
  for (const l of lines) qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) || 0) + l.qty);
  for (const [pid, q] of qtyByProduct) {
    const p = map.get(pid)!;
    if (p.stock < q) throw new CheckoutError(p.stock <= 0 ? `"${p.name}" is out of stock.` : `Only ${p.stock} left of "${p.name}". Please reduce the quantity.`);
  }
  return lines;
}

export async function evaluateCoupon(code: string | undefined | null, subtotal: number, loggedIn: boolean) {
  if (!code?.trim()) return { discount: 0, code: null as string | null };
  const c = await db.query.coupons.findFirst({ where: eq(s.coupons.code, code.trim().toUpperCase()) });
  if (!c || !c.active) throw new CheckoutError("This coupon code is not valid.");
  if (c.expiresAt && c.expiresAt < new Date()) throw new CheckoutError("This coupon has expired.");
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) throw new CheckoutError("This coupon has reached its usage limit.");
  if (c.loginOnly && !loggedIn) throw new CheckoutError("Please log in to use this coupon.");
  if (subtotal < c.minOrder) throw new CheckoutError(`Add items worth ₹${(c.minOrder - subtotal).toLocaleString("en-IN")} more to use this coupon.`);
  let discount = c.type === "FLAT" ? c.value : Math.floor((subtotal * c.value) / 100);
  if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { discount, code: c.code };
}

export async function quote(input: CartLineInput[], opts: { coupon?: string | null; method?: string; loggedIn: boolean }) {
  const st = await getSettings();
  const lines = await priceLines(input);
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const mrpTotal = lines.reduce((a, l) => a + l.mrp * l.qty, 0);
  const c = await evaluateCoupon(opts.coupon, subtotal, opts.loggedIn);
  const shipping = st.freeShippingAbove > 0 && subtotal >= st.freeShippingAbove ? 0 : Number(st.shippingFee) || 0;
  const codFee = opts.method === "COD" ? Number(st.codFee) || 0 : 0;
  const total = subtotal - c.discount + shipping + codFee;
  return { lines, subtotal, mrpTotal, couponCode: c.code, couponDiscount: c.discount, shipping, codFee, total };
}

export async function nextOrderNo() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    const n = Math.floor(100000 + Math.random() * 900000);
    const no = `TWT-${year}-${n}`;
    const exists = await db.query.orders.findFirst({ where: eq(s.orders.orderNo, no), columns: { id: true } });
    if (!exists) return no;
  }
  return `TWT-${year}-${Date.now().toString().slice(-8)}`;
}

/** Mark an order as placed (COD) or paid (online). Idempotent: deducts stock once. */
export async function confirmOrder(orderId: string, opts: { paid: boolean; paymentId?: string; note?: string }) {
  await db.transaction(async (tx) => {
    const [o] = await tx.select().from(s.orders).where(eq(s.orders.id, orderId)).for("update");
    if (!o) return;
    const patch: Partial<typeof s.orders.$inferInsert> = { updatedAt: new Date() };
    if (opts.paid && o.paymentStatus !== "PAID") patch.paymentStatus = "PAID";
    if (opts.paymentId) patch.razorpayPaymentId = opts.paymentId;
    if (o.status === "PENDING_PAYMENT") {
      patch.status = "PLACED";
      await tx.insert(s.orderEvents).values({ orderId, status: "PLACED", note: opts.note || null });
    }
    if (!o.stockDeducted) {
      const items = await tx.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
      for (const it of items) {
        if (it.productId)
          await tx.update(s.products).set({ stock: sql`greatest(${s.products.stock} - ${it.qty}, 0)` }).where(eq(s.products.id, it.productId));
      }
      if (o.couponCode)
        await tx.update(s.coupons).set({ usedCount: sql`${s.coupons.usedCount} + 1` }).where(eq(s.coupons.code, o.couponCode));
      patch.stockDeducted = true;
    }
    await tx.update(s.orders).set(patch).where(eq(s.orders.id, orderId));
  });
  try { revalidateTag("catalog"); } catch {}
}

export async function markPaymentFailed(orderId: string) {
  await db.update(s.orders).set({ paymentStatus: "FAILED", updatedAt: new Date() })
    .where(and(eq(s.orders.id, orderId), eq(s.orders.paymentStatus, "PENDING")));
}

export async function restockOrder(orderId: string) {
  await db.transaction(async (tx) => {
    const [o] = await tx.select().from(s.orders).where(eq(s.orders.id, orderId)).for("update");
    if (!o || !o.stockDeducted) return;
    const items = await tx.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
    for (const it of items)
      if (it.productId) await tx.update(s.products).set({ stock: sql`${s.products.stock} + ${it.qty}` }).where(eq(s.products.id, it.productId));
    await tx.update(s.orders).set({ stockDeducted: false }).where(eq(s.orders.id, orderId));
  });
  try { revalidateTag("catalog"); } catch {}
}
