import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { checkOrderToken, siteUrl } from "@/lib/order-token";
import { createRazorpayOrder, razorpayCreds } from "@/lib/payments/razorpay";
import { createPhonePePayment, phonepeCreds } from "@/lib/payments/phonepe";
import { getSettings } from "@/lib/settings";

// Retry payment for an unpaid online order (also allows switching between online methods).
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { orderNo?: string; k?: string; method?: "RAZORPAY" | "PHONEPE" };
  if (!b.orderNo || !checkOrderToken(b.orderNo, b.k)) return NextResponse.json({ ok: false, error: "Not allowed" }, { status: 403 });
  const o = await db.query.orders.findFirst({ where: eq(s.orders.orderNo, b.orderNo) });
  if (!o || o.paymentStatus === "PAID" || o.paymentMethod === "COD" || o.status === "CANCELLED") return NextResponse.json({ ok: false, error: "This order can't be paid again." }, { status: 400 });
  const method = b.method || (o.paymentMethod as "RAZORPAY" | "PHONEPE");
  const st = await getSettings();
  try {
    if (method === "RAZORPAY" && (await razorpayCreds()).enabled) {
      const r = await createRazorpayOrder(o.total, o.orderNo, { orderNo: o.orderNo });
      await db.update(s.orders).set({ razorpayOrderId: r.id, paymentMethod: "RAZORPAY", paymentStatus: "PENDING" }).where(eq(s.orders.id, o.id));
      return NextResponse.json({ ok: true, razorpay: { key: r.keyId, orderId: r.id, amount: r.amount, name: st.storeName, prefill: { name: o.firstName, email: o.email, contact: o.phone } } });
    }
    if (method === "PHONEPE" && (await phonepeCreds()).enabled) {
      const merchantOrderId = `${o.orderNo}-R${Date.now().toString().slice(-5)}`;
      const pp = await createPhonePePayment(merchantOrderId, o.total, `${siteUrl()}/api/payment/phonepe/return?order=${o.orderNo}&k=${b.k}`);
      await db.update(s.orders).set({ phonepeOrderId: merchantOrderId, paymentMethod: "PHONEPE", paymentStatus: "PENDING" }).where(eq(s.orders.id, o.id));
      return NextResponse.json({ ok: true, redirectExternal: pp.redirectUrl });
    }
    return NextResponse.json({ ok: false, error: "This payment method is not available." }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Couldn't start the payment. Please try again." }, { status: 500 });
  }
}
