import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { phonePeStatus } from "@/lib/payments/phonepe";
import { confirmOrder, markPaymentFailed } from "@/lib/orders";
import { checkOrderToken, siteUrl } from "@/lib/order-token";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const orderNo = u.searchParams.get("order") || "";
  const k = u.searchParams.get("k");
  if (!checkOrderToken(orderNo, k)) return NextResponse.redirect(`${siteUrl()}/track-order`);
  const o = await db.query.orders.findFirst({ where: eq(s.orders.orderNo, orderNo) });
  if (!o) return NextResponse.redirect(`${siteUrl()}/track-order`);
  try {
    const st = await phonePeStatus(o.phonepeOrderId || orderNo);
    if (st.state === "COMPLETED" && st.amount === o.total * 100) await confirmOrder(o.id, { paid: true, note: "Paid online via PhonePe" });
    else if (st.state === "FAILED") await markPaymentFailed(o.id);
  } catch (e) {
    console.error("phonepe status", e);
  }
  return NextResponse.redirect(`${siteUrl()}/order/${orderNo}?k=${k}`);
}
