import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { fmtDate, inr } from "@/lib/format";
import { PrintButton } from "@/components/admin/print-button";

export default async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const o = await db.query.orders.findFirst({ where: eq(s.orders.id, id), with: { items: true } });
  if (!o) notFound();
  const st = await getSettings();
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-ink print:p-0">
      <div className="mb-6 flex justify-end print:hidden"><PrintButton /></div>
      <div className="flex items-start justify-between border-b border-line pb-5">
        <div className="flex items-center gap-3"><img src="/seed/logo.png" alt="" className="h-14" /><div><p className="font-serif text-2xl font-semibold">{st.storeName}</p><p className="text-xs text-muted">{st.address}<br />{st.phone} · {st.email}</p></div></div>
        <div className="text-right"><p className="font-serif text-3xl font-semibold">Invoice</p><p className="text-xs text-muted">#{o.orderNo}<br />{fmtDate(o.createdAt)}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-6 py-5">
        <div><p className="text-[11px] font-bold uppercase tracking-wider text-muted">Bill / Ship to</p><p className="mt-1">{o.firstName} {o.lastName}<br />{o.line1}{o.landmark ? `, ${o.landmark}` : ""}<br />{o.city}, {o.state} {o.pincode}<br />{o.phone} · {o.email}</p></div>
        <div className="text-right"><p className="text-[11px] font-bold uppercase tracking-wider text-muted">Payment</p><p className="mt-1">{o.paymentMethod === "COD" ? "Cash on Delivery" : o.paymentMethod}<br />Status: {o.paymentStatus}</p></div>
      </div>
      <table className="w-full">
        <thead><tr className="border-y border-line text-left text-[11px] uppercase tracking-wider text-muted"><th className="py-2">Item</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Amount</th></tr></thead>
        <tbody>{o.items.map((it) => <tr key={it.id} className="border-b border-line"><td className="py-2.5">{it.name}<br /><span className="text-xs text-muted">{[it.size, it.finish].filter(Boolean).join(" · ")}</span></td><td className="py-2.5 text-right">{inr(it.price)}</td><td className="py-2.5 text-right">{it.qty}</td><td className="py-2.5 text-right">{inr(it.price * it.qty)}</td></tr>)}</tbody>
      </table>
      <dl className="ml-auto mt-4 max-w-xs space-y-1">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
        {o.couponDiscount > 0 && <div className="flex justify-between"><dt>Discount ({o.couponCode})</dt><dd>− {inr(o.couponDiscount)}</dd></div>}
        <div className="flex justify-between"><dt>Shipping</dt><dd>{o.shipping ? inr(o.shipping) : "Free"}</dd></div>
        {o.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{inr(o.codFee)}</dd></div>}
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
      </dl>
      <p className="mt-10 text-center text-xs text-muted">Prices are inclusive of all taxes. Thank you for shopping with {st.storeName}!</p>
    </div>
  );
}
