import Link from "next/link";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { Download, Search } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Badge, Pager, Table, td } from "@/components/admin/ui";
import { fmtDate, inr, ORDER_STATUSES, STATUS_LABEL } from "@/lib/format";

export const metadata = { title: "Orders" };
const PER = 25;

export default async function Orders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; pay?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, +(sp.page || 1));
  const where: SQL[] = [];
  if (sp.status) where.push(eq(s.orders.status, sp.status));
  else where.push(sql`${s.orders.status} <> 'PENDING_PAYMENT'`);
  if (sp.pay) where.push(eq(s.orders.paymentStatus, sp.pay));
  if (sp.q) {
    const t = `%${sp.q.trim()}%`;
    where.push(or(ilike(s.orders.orderNo, t), ilike(s.orders.phone, t), ilike(s.orders.email, t), ilike(s.orders.firstName, t), ilike(s.orders.city, t))!);
  }
  const w = and(...where);
  const [rows, total, counts] = await Promise.all([
    db.query.orders.findMany({ where: w, orderBy: desc(s.orders.createdAt), limit: PER, offset: (page - 1) * PER, with: { items: { columns: { qty: true } } } }),
    db.$count(s.orders, w),
    db.select({ st: s.orders.status, n: sql<number>`count(*)::int` }).from(s.orders).groupBy(s.orders.status),
  ]);
  const c = Object.fromEntries(counts.map((x) => [x.st, x.n]));
  const qs = new URLSearchParams(Object.entries({ q: sp.q, status: sp.status, pay: sp.pay }).filter(([, v]) => v) as [string, string][]).toString();
  const tab = (st: string | undefined, label: string) => (
    <Link href={`/admin/orders${st ? `?status=${st}` : ""}`} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${sp.status === st ? "bg-ink text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink"}`}>
      {label}{st && c[st] ? ` (${c[st]})` : ""}
    </Link>
  );
  return (
    <>
      <AdminHeader title="Orders" sub={`${total} orders`} actions={<a href={`/api/admin/export?type=orders&${qs}`} className="btn-outline btn-sm"><Download className="h-3.5 w-3.5" /> Export CSV</a>} />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {tab(undefined, "All")}
        {ORDER_STATUSES.filter((x) => x !== "PENDING_PAYMENT").map((st) => tab(st, STATUS_LABEL[st].split(" &")[0]))}
        {tab("PENDING_PAYMENT", "Unpaid / abandoned")}
      </div>
      <form className="mb-4 flex flex-wrap gap-2">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input name="q" defaultValue={sp.q} placeholder="Search order no, name, phone, email, city" className="input pl-9" /></div>
        <select name="pay" defaultValue={sp.pay || ""} className="input !w-auto"><option value="">Any payment</option><option value="PAID">Paid</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option></select>
        <button className="btn-dark btn-sm">Filter</button>
      </form>
      <Table head={["Order", "Customer", "Date", "Items", "Total", "Payment", "Status"]} empty={!rows.length}>
        {rows.map((o) => (
          <tr key={o.id} className="hover:bg-cream/50">
            <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-teak-dark hover:underline">{o.orderNo}</Link></td>
            <td className={td}>{o.firstName} {o.lastName}<br /><span className="text-xs text-muted">{o.phone} · {o.city}</span></td>
            <td className={`${td} whitespace-nowrap text-xs text-muted`}>{fmtDate(o.createdAt, true)}</td>
            <td className={td}>{o.items.reduce((a, b) => a + b.qty, 0)}</td>
            <td className={`${td} font-semibold`}>{inr(o.total)}</td>
            <td className={td}><Badge v={o.paymentStatus} label={`${o.paymentMethod === "COD" ? "COD" : o.paymentMethod === "PHONEPE" ? "PhonePe" : "Razorpay"} · ${o.paymentStatus.toLowerCase()}`} /></td>
            <td className={td}><Badge v={o.status} /></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.ceil(total / PER)} base={`/admin/orders?${qs}`} />
    </>
  );
}
