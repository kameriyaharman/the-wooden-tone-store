import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema as s } from "@/lib/db";
import { quote, nextOrderNo, confirmOrder, CheckoutError } from "@/lib/orders";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { razorpayCreds, createRazorpayOrder } from "@/lib/payments/razorpay";
import { phonepeCreds, createPhonePePayment } from "@/lib/payments/phonepe";
import { orderToken, siteUrl } from "@/lib/order-token";
import { eq } from "drizzle-orm";

const schema = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99), finish: z.string().nullish(), size: z.string().nullish() })).min(1),
  coupon: z.string().nullish(),
  method: z.enum(["RAZORPAY", "PHONEPE", "COD"]),
  address: z.object({
    firstName: z.string().trim().min(1, "First name is required").max(60),
    lastName: z.string().trim().max(60).optional().default(""),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    phone: z.string().trim().transform((v) => v.replace(/[^\d]/g, "").replace(/^(91|0)(?=\d{10}$)/, "")).pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")),
    line1: z.string().trim().min(5, "Enter your full address").max(300),
    city: z.string().trim().min(2, "City is required").max(80),
    state: z.string().trim().min(2, "Select your state"),
    pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
    landmark: z.string().trim().max(120).optional().default(""),
  }),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ ok: false, error: first?.message || "Please check your details.", field: first?.path.at(-1) }, { status: 400 });
  }
  const { items, coupon, method, address, note } = parsed.data;
  const session = await getSession();
  const st = await getSettings();
  try {
    if (method === "COD" && !st.codEnabled) throw new CheckoutError("Cash on Delivery is not available right now.");
    if (method === "RAZORPAY" && !(await razorpayCreds()).enabled) throw new CheckoutError("Online payment is not available right now. Please choose another method.");
    if (method === "PHONEPE" && !(await phonepeCreds()).enabled) throw new CheckoutError("PhonePe is not available right now. Please choose another method.");
    const q = await quote(items, { coupon, method, loggedIn: !!session });
    if (method === "COD" && st.codMaxOrder && q.total > Number(st.codMaxOrder))
      throw new CheckoutError(`Cash on Delivery is available for orders up to ₹${Number(st.codMaxOrder).toLocaleString("en-IN")}. Please pay online.`);

    const orderNo = await nextOrderNo();
    const [order] = await db.transaction(async (tx) => {
      const o = await tx.insert(s.orders).values({
        orderNo, userId: session?.uid || null,
        firstName: address.firstName, lastName: address.lastName || null, email: address.email, phone: address.phone,
        line1: address.line1, city: address.city, state: address.state, pincode: address.pincode, landmark: address.landmark || null,
        mrpTotal: q.mrpTotal, subtotal: q.subtotal, couponCode: q.couponCode, couponDiscount: q.couponDiscount,
        shipping: q.shipping, codFee: q.codFee, total: q.total, paymentMethod: method, customerNote: note || null,
      }).returning();
      await tx.insert(s.orderItems).values(q.lines.map((l) => ({ orderId: o[0].id, productId: l.productId, name: l.name, image: l.image, price: l.price, mrp: l.mrp, qty: l.qty, finish: l.finish, size: l.size })));
      return o;
    });
    const k = orderToken(orderNo);
    const thanks = `/order/${orderNo}?k=${k}`;

    if (method === "COD") {
      await confirmOrder(order.id, { paid: false, note: "Cash on Delivery" });
      return NextResponse.json({ ok: true, orderNo, redirect: thanks });
    }
    if (method === "RAZORPAY") {
      const r = await createRazorpayOrder(q.total, orderNo, { orderNo });
      await db.update(s.orders).set({ razorpayOrderId: r.id }).where(eq(s.orders.id, order.id));
      return NextResponse.json({
        ok: true, orderNo, redirect: thanks,
        razorpay: { key: r.keyId, orderId: r.id, amount: r.amount, name: st.storeName, prefill: { name: `${address.firstName} ${address.lastName || ""}`.trim(), email: address.email, contact: address.phone } },
      });
    }
    const pp = await createPhonePePayment(orderNo, q.total, `${siteUrl()}/api/payment/phonepe/return?order=${orderNo}&k=${k}`);
    await db.update(s.orders).set({ phonepeOrderId: orderNo }).where(eq(s.orders.id, order.id));
    return NextResponse.json({ ok: true, orderNo, redirectExternal: pp.redirectUrl });
  } catch (e) {
    if (e instanceof CheckoutError) return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    console.error("checkout error", e);
    return NextResponse.json({ ok: false, error: "We couldn't start the payment. Please try again or choose Cash on Delivery." }, { status: 500 });
  }
}
