import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Search } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { PageHero } from "@/components/ui";
import { OrderItems, Timeline, payLabel } from "@/components/order-view";
import { fmtDate, inr, STATUS_LABEL } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { orderToken } from "@/lib/order-token";
import { WhatsappIcon } from "@/components/icons";

export const metadata = { title: "Track Your Order" };

const norm = (v: string) => v.trim().toLowerCase().replace(/[^\da-z@.]/g, "").replace(/^(91|0)(?=\d{10}$)/, "");

export default async function Track({ searchParams }: { searchParams: Promise<{ order?: string; contact?: string }> }) {
  const { order = "", contact = "" } = await searchParams;
  const st = await getSettings();
  let o: Awaited<ReturnType<typeof find>> | null = null;
  let error = "";
  async function find(no: string) {
    return db.query.orders.findFirst({ where: eq(s.orders.orderNo, no), with: { items: true, events: { orderBy: asc(s.orderEvents.createdAt) } } });
  }
  if (order && contact) {
    const found = await find(order.trim().toUpperCase());
    const c = norm(contact);
    if (found && (norm(found.phone) === c || found.email.toLowerCase() === c)) o = found;
    else error = "We couldn't find an order with these details. Please check the Order ID and the phone number or email used at checkout.";
  }
  return (
    <>
      <PageHero eyebrow="Order status" title="Track Your Order" sub="Enter your order ID and phone number to see live delivery status." crumbs={[{ href: "/", label: "Home" }, { label: "Track Order" }]} />
      <div className="container-site grid items-start gap-6 py-10 md:py-14 lg:grid-cols-[1fr_1.7fr]">
        <form className="card p-5 md:p-6" method="get">
          <h2 className="font-serif text-3xl font-semibold">Find your order</h2>
          <label className="label req mt-5" htmlFor="order">Order ID</label>
          <input id="order" name="order" defaultValue={order} required placeholder="TWT-2026-123456" className="input uppercase" />
          <label className="label req mt-4" htmlFor="contact">Phone / Email</label>
          <input id="contact" name="contact" defaultValue={contact} required placeholder="+91 98xxx xxxxx" className="input" />
          <button className="btn-gold mt-5 w-full"><Search className="h-4 w-4" /> Track Order</button>
          <p className="mt-3 text-xs text-muted">Your Order ID is in the confirmation email &amp; SMS.</p>
          {error && <p className="mt-4 rounded-lg bg-[#FDECEE] p-3 text-sm text-sale">{error}</p>}
        </form>
        {o ? (
          <div className="card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="text-lg font-bold">Order #{o.orderNo}</p>
                <p className="text-xs text-muted">Placed on {fmtDate(o.createdAt)} · {o.items.length} items · {inr(o.total)} · {payLabel(o)}</p>
              </div>
              <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-teak-dark">{STATUS_LABEL[o.status]}</span>
            </div>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <Timeline order={o} events={o.events} />
              <div className="space-y-4">
                <OrderItems items={o.items} />
                <div className="rounded-xl border border-[#EADFCB] bg-tint p-3.5 text-sm">
                  <p className="font-semibold text-teak-dark">Delivery address</p>
                  <p className="text-teak-dark/90">{o.firstName} {o.lastName} · {o.city}, {o.state} {o.pincode}</p>
                </div>
                {o.trackingNo && <p className="text-sm">Courier: <b>{o.courier}</b> · {o.trackingNo} {o.trackingUrl && <a className="link-gold" href={o.trackingUrl} target="_blank" rel="noreferrer">Track →</a>}</p>}
                <a href={`https://wa.me/${st.whatsapp}?text=${encodeURIComponent(`Hi, I need help with order ${o.orderNo}`)}`} target="_blank" rel="noreferrer" className="btn-outline w-full"><WhatsappIcon className="h-4 w-4" /> Need help? Chat with us</a>
                {o.status === "PENDING_PAYMENT" && <Link href={`/order/${o.orderNo}?k=${orderToken(o.orderNo)}`} className="btn-gold w-full">Complete payment</Link>}
              </div>
            </div>
          </div>
        ) : (
          <div className="card grid min-h-[280px] place-items-center p-8 text-center text-sm text-muted">Your order timeline will appear here.</div>
        )}
      </div>
    </>
  );
}
