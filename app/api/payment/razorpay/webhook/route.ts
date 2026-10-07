import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { hmac, razorpayCreds, safeEqual } from "@/lib/payments/razorpay";
import { confirmOrder, markPaymentFailed } from "@/lib/orders";

// Configure in Razorpay Dashboard → Webhooks: events payment.captured, order.paid, payment.failed
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  const { webhookSecret } = await razorpayCreds();
  if (!webhookSecret || !safeEqual(hmac(webhookSecret, raw), sig)) return NextResponse.json({ ok: false }, { status: 401 });
  const ev = JSON.parse(raw);
  const pay = ev?.payload?.payment?.entity;
  const rzpOrderId: string | undefined = pay?.order_id || ev?.payload?.order?.entity?.id;
  if (!rzpOrderId) return NextResponse.json({ ok: true });
  const o = await db.query.orders.findFirst({ where: eq(s.orders.razorpayOrderId, rzpOrderId) });
  if (!o) return NextResponse.json({ ok: true });
  if (ev.event === "payment.captured" || ev.event === "order.paid") {
    if (pay && pay.amount !== o.total * 100) console.warn("Razorpay amount mismatch", o.orderNo);
    else await confirmOrder(o.id, { paid: true, paymentId: pay?.id, note: "Paid online via Razorpay" });
  } else if (ev.event === "payment.failed") {
    await markPaymentFailed(o.id);
  }
  return NextResponse.json({ ok: true });
}
