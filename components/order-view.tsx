import { Check, Package, Truck, Home, Clock } from "lucide-react";
import { inr, fmtDate, STATUS_LABEL, TIMELINE } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/db/schema";

type Ev = { status: string; note: string | null; createdAt: Date };

export function Timeline({ order, events }: { order: Order; events: Ev[] }) {
  if (order.status === "CANCELLED" || order.status === "RETURNED")
    return <p className="rounded-xl bg-[#FDECEE] p-4 text-sm font-semibold text-sale">This order was {order.status === "CANCELLED" ? "cancelled" : "returned"}.</p>;
  if (order.status === "PENDING_PAYMENT")
    return <p className="flex items-center gap-2 rounded-xl bg-tint p-4 text-sm font-semibold text-teak-dark"><Clock className="h-4 w-4" /> Awaiting payment</p>;
  const curIdx = TIMELINE.indexOf(order.status as (typeof TIMELINE)[number]);
  const at = (st: string) => events.find((e) => e.status === st);
  return (
    <ol className="relative">
      {TIMELINE.map((st, i) => {
        const done = i < curIdx || (i === curIdx && st === "DELIVERED");
        const cur = i === curIdx && st !== "DELIVERED";
        const ev = at(st);
        return (
          <li key={st} className="relative flex gap-3 pb-6 last:pb-0">
            {i < TIMELINE.length - 1 && <span className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${i < curIdx ? "bg-stock/40" : "bg-line"}`} />}
            <span className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ${done ? "bg-stock text-white" : cur ? "bg-teak text-white ring-4 ring-tint" : "bg-cream text-muted ring-1 ring-line"}`}>
              {done ? <Check className="h-3.5 w-3.5" /> : st === "OUT_FOR_DELIVERY" || st === "SHIPPED" ? <Truck className="h-3.5 w-3.5" /> : st === "DELIVERED" ? <Home className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
            </span>
            <div>
              <p className={`text-sm font-semibold ${!done && !cur ? "text-muted" : ""}`}>{STATUS_LABEL[st]}</p>
              <p className="text-xs text-muted">
                {ev ? fmtDate(ev.createdAt, true) : i > curIdx ? "Pending" : ""}
                {ev?.note ? ` · ${ev.note}` : ""}
                {st === "SHIPPED" && order.courier && i <= curIdx ? ` · via ${order.courier}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItems({ items }: { items: OrderItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-3">
          {it.image && <img src={it.image} alt="" className="h-14 w-14 rounded-lg object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[13px] font-medium">{it.name.replace(/^The Wooden Tone /, "")}</p>
            <p className="text-[11px] text-muted">Qty {it.qty}{it.size ? ` · ${it.size}` : ""}{it.finish ? ` · ${it.finish}` : ""}</p>
          </div>
          <p className="text-sm font-bold">{inr(it.price * it.qty)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ o }: { o: Order }) {
  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
      {o.couponDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Coupon ({o.couponCode})</dt><dd className="text-stock">− {inr(o.couponDiscount)}</dd></div>}
      <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{o.shipping ? inr(o.shipping) : "FREE"}</dd></div>
      {o.codFee > 0 && <div className="flex justify-between"><dt className="text-muted">COD fee</dt><dd>{inr(o.codFee)}</dd></div>}
      <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
    </dl>
  );
}

export const payLabel = (o: Order) =>
  (o.paymentMethod === "COD" ? "Cash on Delivery" : o.paymentMethod === "PHONEPE" ? "PhonePe" : "Online (Razorpay)") +
  " · " + (o.paymentStatus === "PAID" ? "Paid" : o.paymentStatus === "FAILED" ? "Failed" : o.paymentStatus === "REFUNDED" ? "Refunded" : o.paymentMethod === "COD" ? "Pay on delivery" : "Pending");
