import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, Printer, ExternalLink } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Badge, Panel, Field } from "@/components/admin/ui";
import { Submit } from "@/components/admin/inputs";
import { fmtDate, inr, ORDER_STATUSES, STATUS_LABEL, INDIAN_STATES } from "@/lib/format";
import { updateOrderAddress, updateOrderShipping, updateOrderStatus, updatePaymentStatus } from "@/lib/admin-actions";
import { orderToken } from "@/lib/order-token";
import { WhatsappIcon } from "@/components/icons";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await db.query.orders.findFirst({ where: eq(s.orders.id, id), with: { items: true, events: { orderBy: asc(s.orderEvents.createdAt) } } });
  if (!o) notFound();
  const wa = `https://wa.me/91${o.phone}?text=${encodeURIComponent(`Hi ${o.firstName}, this is The Wooden Tone about your order ${o.orderNo}. `)}`;
  return (
    <>
      <Link href="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Orders</Link>
      <AdminHeader
        title={`Order ${o.orderNo}`}
        sub={`Placed ${fmtDate(o.createdAt, true)}`}
        actions={<>
          <a href={wa} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><WhatsappIcon className="h-3.5 w-3.5" /> WhatsApp customer</a>
          <a href={`/admin/invoice/${o.id}`} target="_blank" className="btn-outline btn-sm"><Printer className="h-3.5 w-3.5" /> Invoice</a>
          <a href={`/order/${o.orderNo}?k=${orderToken(o.orderNo)}`} target="_blank" className="btn-outline btn-sm"><ExternalLink className="h-3.5 w-3.5" /> Customer view</a>
        </>}
      />
      <div className="mb-5 flex flex-wrap gap-2"><Badge v={o.status} /><Badge v={o.paymentStatus} label={`Payment: ${o.paymentStatus.toLowerCase()}`} /><Badge v="x" label={o.paymentMethod === "COD" ? "Cash on Delivery" : o.paymentMethod === "PHONEPE" ? "PhonePe" : "Razorpay"} /></div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Panel title={`Items (${o.items.length})`}>
            <ul className="divide-y divide-line">
              {o.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3">
                  {it.image && <img src={it.image} alt="" className="h-14 w-14 rounded-lg object-cover" />}
                  <div className="min-w-0 flex-1">
                    {it.productId ? <Link href={`/admin/products/${it.productId}`} className="text-sm font-medium hover:text-teak-dark">{it.name}</Link> : <p className="text-sm font-medium">{it.name}</p>}
                    <p className="text-xs text-muted">{[it.size && `Size: ${it.size}`, it.finish && `Finish: ${it.finish}`].filter(Boolean).join(" · ")}</p>
                  </div>
                  <p className="text-sm text-muted">{inr(it.price)} × {it.qty}</p>
                  <p className="w-24 text-right font-semibold">{inr(it.price * it.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="ml-auto mt-3 max-w-xs space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">MRP total</dt><dd>{inr(o.mrpTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
              {o.couponDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Coupon {o.couponCode}</dt><dd className="text-stock">− {inr(o.couponDiscount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{o.shipping ? inr(o.shipping) : "Free"}</dd></div>
              {o.codFee > 0 && <div className="flex justify-between"><dt className="text-muted">COD fee</dt><dd>{inr(o.codFee)}</dd></div>}
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
            </dl>
          </Panel>
          <Panel title="Update status">
            <form key={`st-${o.status}-${o.events.length}`} action={updateOrderStatus} className="grid gap-3 md:grid-cols-[200px_1fr_auto] md:items-end">
              <input type="hidden" name="id" value={o.id} />
              <Field label="Status"><select name="status" defaultValue={o.status} className="input">{ORDER_STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}</select></Field>
              <Field label="Note (shown to customer on tracking)"><input name="note" className="input" placeholder="e.g. via Delhivery, expected by 6 PM" /></Field>
              <Submit className="btn-gold">Update</Submit>
            </form>
            <ol className="mt-5 space-y-2 border-t border-line pt-4">
              {o.events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm"><span className="w-36 shrink-0 text-xs text-muted">{fmtDate(e.createdAt, true)}</span><span><b>{STATUS_LABEL[e.status]}</b>{e.note && <span className="text-muted"> — {e.note}</span>}</span></li>
              ))}
            </ol>
            <p className="mt-3 text-xs text-muted">Cancelling or marking returned puts the items back into stock automatically. Marking a COD order delivered marks it paid.</p>
          </Panel>
          <Panel title="Shipping & internal notes">
            <form key={`sh-${o.updatedAt.getTime()}`} action={updateOrderShipping} className="grid gap-3 md:grid-cols-3">
              <input type="hidden" name="id" value={o.id} />
              <Field label="Courier"><input name="courier" defaultValue={o.courier || ""} className="input" placeholder="Delhivery / own vehicle" /></Field>
              <Field label="Tracking / AWB no."><input name="trackingNo" defaultValue={o.trackingNo || ""} className="input" /></Field>
              <Field label="Tracking link"><input name="trackingUrl" defaultValue={o.trackingUrl || ""} className="input" placeholder="https://" /></Field>
              <Field label="Internal note (not shown to customer)" className="md:col-span-3"><textarea name="adminNote" defaultValue={o.adminNote || ""} rows={2} className="input" /></Field>
              <div><Submit className="btn-dark btn-sm">Save</Submit></div>
            </form>
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Payment">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Method</dt><dd>{o.paymentMethod}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Status</dt><dd><Badge v={o.paymentStatus} /></dd></div>
              {o.razorpayPaymentId && <div className="flex justify-between gap-3"><dt className="text-muted">Razorpay ID</dt><dd className="truncate font-mono text-xs">{o.razorpayPaymentId}</dd></div>}
              {o.razorpayOrderId && <div className="flex justify-between gap-3"><dt className="text-muted">Razorpay order</dt><dd className="truncate font-mono text-xs">{o.razorpayOrderId}</dd></div>}
              {o.phonepeOrderId && o.paymentMethod === "PHONEPE" && <div className="flex justify-between gap-3"><dt className="text-muted">PhonePe ref</dt><dd className="truncate font-mono text-xs">{o.phonepeOrderId}</dd></div>}
            </dl>
            <form key={`ps-${o.paymentStatus}`} action={updatePaymentStatus} className="mt-4 flex gap-2">
              <input type="hidden" name="id" value={o.id} />
              <select name="paymentStatus" defaultValue={o.paymentStatus} className="input"><option value="PENDING">Pending</option><option value="PAID">Paid / received</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option></select>
              <Submit className="btn-dark btn-sm">Save</Submit>
            </form>
          </Panel>
          <Panel title="Customer & delivery address">
            <form action={updateOrderAddress} className="grid gap-2.5 sm:grid-cols-2">
              <input type="hidden" name="id" value={o.id} />
              <input name="firstName" defaultValue={o.firstName} className="input" aria-label="First name" />
              <input name="lastName" defaultValue={o.lastName || ""} className="input" aria-label="Last name" />
              <input name="phone" defaultValue={o.phone} className="input" aria-label="Phone" />
              <input name="email" defaultValue={o.email} className="input" aria-label="Email" />
              <textarea name="line1" defaultValue={o.line1} rows={2} className="input sm:col-span-2" aria-label="Address" />
              <input name="city" defaultValue={o.city} className="input" aria-label="City" />
              <input name="pincode" defaultValue={o.pincode} className="input" aria-label="PIN" />
              <select name="state" defaultValue={o.state} className="input" aria-label="State">{INDIAN_STATES.map((x) => <option key={x}>{x}</option>)}</select>
              <input name="landmark" defaultValue={o.landmark || ""} placeholder="Landmark" className="input" />
              <div className="sm:col-span-2"><Submit className="btn-outline btn-sm">Save address</Submit></div>
            </form>
            {o.customerNote && <p className="mt-4 rounded-lg bg-tint p-3 text-sm"><b>Customer note:</b> {o.customerNote}</p>}
            <p className="mt-3 text-xs text-muted">{o.userId ? "Registered customer" : "Guest checkout"}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
