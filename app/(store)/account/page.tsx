import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { LogOut, Mail, Package, Phone, User } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { fmtDate, inr, STATUS_LABEL } from "@/lib/format";
import { PageHero } from "@/components/ui";

export const metadata = { title: "My Account" };

export default async function Account() {
  const session = await requireUser("/account");
  const user = await db.query.users.findFirst({ where: eq(s.users.id, session.uid) });
  const orders = await db.query.orders.findMany({ where: eq(s.orders.userId, session.uid), orderBy: desc(s.orders.createdAt), with: { items: true } });
  return (
    <>
      <PageHero eyebrow="My account" title={`Hello, ${session.name.split(" ")[0]}`} crumbs={[{ href: "/", label: "Home" }, { label: "Account" }]} />
      <div className="container-site grid items-start gap-6 py-10 lg:grid-cols-[1fr_2.2fr]">
        <div className="card p-5">
          <p className="font-serif text-2xl font-semibold">Profile</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex gap-3"><User className="mt-0.5 h-4 w-4 text-teak" /><div><dt className="text-muted">Name</dt><dd>{user?.name}</dd></div></div>
            <div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 text-teak" /><div><dt className="text-muted">Email</dt><dd>{user?.email}</dd></div></div>
            <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 text-teak" /><div><dt className="text-muted">Phone</dt><dd>{user?.phone || "—"}</dd></div></div>
          </dl>
          <div className="mt-5 flex flex-col gap-2">
            {session.role === "ADMIN" && <Link href="/admin" className="btn-dark">Open Admin Panel</Link>}
            <Link href="/wishlist" className="btn-outline">My Wishlist</Link>
            <form action={logoutAction}><button className="btn-outline w-full"><LogOut className="h-4 w-4" /> Logout</button></form>
          </div>
        </div>
        <div className="card p-5">
          <p className="font-serif text-2xl font-semibold">My Orders</p>
          {orders.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted"><Package className="mx-auto h-10 w-10 text-line" /><p className="mt-2">No orders yet.</p><Link href="/shop" className="btn-gold mt-4">Start shopping</Link></div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/${o.orderNo}`} className="flex items-center gap-4 py-4 hover:bg-cream/50">
                    <div className="flex -space-x-3">{o.items.slice(0, 3).map((i) => i.image && <img key={i.id} src={i.image} alt="" className="h-12 w-12 rounded-lg border-2 border-white object-cover" />)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">#{o.orderNo}</p>
                      <p className="text-xs text-muted">{fmtDate(o.createdAt)} · {o.items.length} items · {inr(o.total)}</p>
                    </div>
                    <span className="rounded-full bg-tint px-3 py-1 text-xs font-semibold text-teak-dark">{STATUS_LABEL[o.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
