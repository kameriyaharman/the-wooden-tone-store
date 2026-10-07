import Link from "next/link";
import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { ArrowRight, IndianRupee, Package, ShoppingBag, AlertTriangle } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Badge, Panel, Table, td } from "@/components/admin/ui";
import { fmtDate, inr } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { razorpayCreds } from "@/lib/payments/razorpay";
import { phonepeCreds } from "@/lib/payments/phonepe";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const since30 = new Date(Date.now() - 30 * 864e5);
  const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) + "T00:00:00+05:30");
  const valid = and(ne(s.orders.status, "PENDING_PAYMENT"), ne(s.orders.status, "CANCELLED"));
  const [rev30, todayOrders, toProcess, lowStock, recent, daily, st, rz, pp, productCount] = await Promise.all([
    db.select({ v: sql<number>`coalesce(sum(${s.orders.total}),0)::int`, n: sql<number>`count(*)::int` }).from(s.orders).where(and(valid, gte(s.orders.createdAt, since30))),
    db.$count(s.orders, and(valid, gte(s.orders.createdAt, today))),
    db.$count(s.orders, inArray(s.orders.status, ["PLACED", "CONFIRMED", "PACKED"])),
    db.select({ id: s.products.id, name: s.products.name, stock: s.products.stock, images: s.products.images }).from(s.products).where(and(eq(s.products.active, true), lte(s.products.stock, 3))).orderBy(asc(s.products.stock)).limit(8),
    db.select().from(s.orders).orderBy(desc(s.orders.createdAt)).limit(8),
    db.select({ d: sql<string>`to_char(${s.orders.createdAt} at time zone 'Asia/Kolkata', 'DD Mon')`, day: sql<string>`date_trunc('day', ${s.orders.createdAt} at time zone 'Asia/Kolkata')`, v: sql<number>`sum(${s.orders.total})::int` })
      .from(s.orders).where(and(valid, gte(s.orders.createdAt, new Date(Date.now() - 14 * 864e5)))).groupBy(sql`1, 2`).orderBy(sql`2`),
    getSettings(), razorpayCreds(), phonepeCreds(),
    db.$count(s.products, eq(s.products.active, true)),
  ]);
  const max = Math.max(1, ...daily.map((d) => d.v));
  const setupWarnings = [
    !rz.enabled && !pp.enabled && "No online payment gateway is enabled yet — only Cash on Delivery is available. Add Razorpay or PhonePe keys in Settings → Payments.",
    st.phone.includes("00000") && "Store phone/WhatsApp number is still the placeholder. Update it in Settings → Store.",
    st.address.includes("update in Admin") && "Showroom address is not set. Update it in Settings → Store.",
  ].filter(Boolean) as string[];
  const stats = [
    { label: "Revenue (30 days)", value: inr(rev30[0].v), Icon: IndianRupee },
    { label: "Orders (30 days)", value: rev30[0].n, Icon: ShoppingBag },
    { label: "Orders today", value: todayOrders, Icon: ShoppingBag },
    { label: "To process", value: toProcess, Icon: Package, href: "/admin/orders?status=PLACED" },
  ];
  return (
    <>
      <AdminHeader title="Dashboard" sub={`${productCount} live products`} actions={<Link href="/admin/products/new" className="btn-gold btn-sm">+ Add product</Link>} />
      {setupWarnings.map((w) => (
        <p key={w} className="mb-3 flex items-start gap-2 rounded-lg border border-[#F2D9A6] bg-[#FFF8E8] p-3 text-sm text-[#7A5600]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}</p>
      ))}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, Icon, href }) => {
          const inner = (
            <>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-tint text-teak-dark"><Icon className="h-4 w-4" /></span>
              <p className="mt-3 text-2xl font-extrabold">{value}</p>
              <p className="text-xs text-muted">{label}</p>
            </>
          );
          return href ? <Link key={label} href={href} className="rounded-2xl border border-line bg-white p-4 hover:border-teak">{inner}</Link> : <div key={label} className="rounded-2xl border border-line bg-white p-4">{inner}</div>;
        })}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Sales — last 14 days">
          {daily.length === 0 ? <p className="py-10 text-center text-sm text-muted">No sales yet.</p> : (
            <div className="flex h-48 items-end gap-2">
              {daily.map((d) => (
                <div key={d.day} className="group flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100">{inr(d.v)}</span>
                  <div className="w-full rounded-t-md bg-teak/80 hover:bg-teak" style={{ height: `${(d.v / max) * 150}px` }} />
                  <span className="text-[10px] text-muted">{d.d}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Low stock" actions={<Link href="/admin/products?stock=low" className="text-xs font-semibold text-teak-dark">View all</Link>}>
          {lowStock.length === 0 ? <p className="text-sm text-muted">All products are well stocked.</p> : (
            <ul className="space-y-2">
              {lowStock.map((p) => (
                <li key={p.id}><Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 text-sm hover:text-teak-dark">
                  {p.images[0] && <img src={p.images[0]} alt="" className="h-9 w-9 rounded-md object-cover" />}
                  <span className="line-clamp-1 flex-1">{p.name}</span>
                  <span className={`font-bold ${p.stock <= 0 ? "text-sale" : "text-[#B85A12]"}`}>{p.stock}</span>
                </Link></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-[15px] font-bold">Recent orders</h2><Link href="/admin/orders" className="flex items-center gap-1 text-xs font-semibold text-teak-dark">All orders <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        <Table head={["Order", "Customer", "Date", "Total", "Payment", "Status"]} empty={!recent.length}>
          {recent.map((o) => (
            <tr key={o.id} className="hover:bg-cream/50">
              <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-semibold text-teak-dark">{o.orderNo}</Link></td>
              <td className={td}>{o.firstName} {o.lastName}<br /><span className="text-xs text-muted">{o.city}</span></td>
              <td className={`${td} text-xs text-muted`}>{fmtDate(o.createdAt, true)}</td>
              <td className={`${td} font-semibold`}>{inr(o.total)}</td>
              <td className={td}><Badge v={o.paymentStatus} label={`${o.paymentMethod === "COD" ? "COD" : o.paymentMethod === "PHONEPE" ? "PhonePe" : "Razorpay"} · ${o.paymentStatus.toLowerCase()}`} /></td>
              <td className={td}><Badge v={o.status} /></td>
            </tr>
          ))}
        </Table>
      </div>
    </>
  );
}
