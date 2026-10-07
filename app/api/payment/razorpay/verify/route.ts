import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { verifyRazorpayPayment } from "@/lib/payments/razorpay";
import { confirmOrder, markPaymentFailed } from "@/lib/orders";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { orderNo?: string; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string; failed?: boolean };
  if (!b.orderNo) return NextResponse.json({ ok: false }, { status: 400 });
  const o = await db.query.orders.findFirst({ where: eq(s.orders.orderNo, b.orderNo) });
  if (!o) return NextResponse.json({ ok: false }, { status: 404 });
  if (b.failed) {
    await markPaymentFailed(o.id);
    return NextResponse.json({ ok: false });
  }
  if (!b.razorpay_order_id || b.razorpay_order_id !== o.razorpayOrderId || !b.razorpay_payment_id || !b.razorpay_signature)
    return NextResponse.json({ ok: false, error: "Invalid payment response" }, { status: 400 });
  const valid = await verifyRazorpayPayment(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature);
  if (!valid) return NextResponse.json({ ok: false, error: "Payment verification failed" }, { status: 400 });
  await confirmOrder(o.id, { paid: true, paymentId: b.razorpay_payment_id, note: "Paid online via Razorpay" });
  return NextResponse.json({ ok: true });
}
