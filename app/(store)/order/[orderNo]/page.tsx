import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkOrderToken, orderToken } from "@/lib/order-token";
import { razorpayCreds } from "@/lib/payments/razorpay";
import { phonepeCreds } from "@/lib/payments/phonepe";
import { getSettings } from "@/lib/settings";
import { OrderItems, OrderTotals, Timeline, payLabel } from "@/components/order-view";
import { RetryPayment } from "@/components/order-pay";
import { fmtDate } from "@/lib/format";
import { WhatsappIcon } from "@/components/icons";

export const metadata = { title: "Your Order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ orderNo: string }>; searchParams: Promise<{ k?: string }> }) {
  const { orderNo } = await params;
  const { k } = await searchParams;
  const o = await db.query.orders.findFirst({ where: eq(s.orders.orderNo, orderNo), with: { items: true, events: { orderBy: asc(s.orderEvents.createdAt) } } });
  if (!o) notFound();
  const session = await getSession();
  const allowed = checkOrderToken(orderNo, k) || (session && (session.uid === o.userId || session.role === "ADMIN"));
  if (!allowed) notFound();
  const [rz, pp, st] = await Promise.all([razorpayCreds(), phonepeCreds(), getSettings()]);
  const unpaidOnline = o.paymentMethod !== "COD" && o.paymentStatus !== "PAID" && o.status !== "CANCELLED";
  const placed = o.status !== "PENDING_PAYMENT";

  return (
    <div className="container-site max-w-4xl py-10 md:py-14">
      <div className="text-center">
        {placed ? <CheckCircle2 className="mx-auto h-14 w-14 text-stock" /> : o.paymentStatus === "FAILED" ? <XCircle className="mx-auto h-14 w-14 text-sale" /> : <Clock className="mx-auto h-14 w-14 text-teak" />}
        <h1 className="h-display mt-4 text-[38px] md:text-[48px]">
          {placed ? `Thank you, ${o.firstName}!` : o.paymentStatus === "FAILED" ? "Payment didn't go through" : "Complete your payment"}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-muted">
          {placed
            ? `Your order ${o.orderNo} has been placed. We'll keep you updated on ${o.phone}${o.email ? ` and ${o.email}` : ""}.`
            : `Your order ${o.orderNo} is saved but not paid yet. Your cart items are reserved once payment succeeds.`}
        </p>
        {unpaidOnline && <div className="flex justify-center"><RetryPayment orderNo={o.orderNo} k={orderToken(o.orderNo)} methods={{ razorpay: rz.enabled, phonepe: pp.enabled }} /></div>}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-[1.2fr_1fr]">
        <div className="card p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line pb-4">
            <div>
              <p className="font-bold">Order #{o.orderNo}</p>
              <p className="text-xs text-muted">Placed on {fmtDate(o.createdAt, true)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
            </div>
            <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-teak-dark">{payLabel(o)}</span>
          </div>
          <div className="mt-5"><Timeline order={o} events={o.events} /></div>
          {o.trackingNo && (
            <p className="mt-4 rounded-lg bg-cream p-3 text-sm">
              Tracking: <b>{o.courier}</b> · {o.trackingNo}
              {o.trackingUrl && <> · <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="link-gold">Track shipment</a></>}
            </p>
          )}
        </div>
        <div className="space-y-5">
          <div className="card p-5">
            <OrderItems items={o.items} />
            <div className="mt-4 border-t border-line pt-4"><OrderTotals o={o} /></div>
          </div>
          <div className="rounded-2xl border border-[#EADFCB] bg-tint p-4 text-sm">
            <p className="font-semibold text-teak-dark">Delivery address</p>
            <p className="mt-1 text-teak-dark/90">{o.firstName} {o.lastName} · {o.phone}<br />{o.line1}{o.landmark ? `, ${o.landmark}` : ""}<br />{o.city}, {o.state} {o.pincode}</p>
          </div>
          <a href={`https://wa.me/${st.whatsapp}?text=${encodeURIComponent(`Hi, I need help with my order ${o.orderNo}`)}`} target="_blank" rel="noreferrer" className="btn-outline w-full"><WhatsappIcon className="h-4 w-4" /> Need help? Chat with us</a>
        </div>
      </div>
      <div className="mt-8 text-center"><Link href="/shop" className="link-gold">Continue shopping →</Link></div>
    </div>
  );
}
