import { desc, ilike, or, sql } from "drizzle-orm";
import { Download, Search } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Badge, Table, td } from "@/components/admin/ui";
import { Submit } from "@/components/admin/inputs";
import { setUserRole } from "@/lib/admin-actions";
import { fmtDate, inr } from "@/lib/format";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Customers" };

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const me = await getSession();
  const rows = await db.select({
    u: s.users,
    orders: sql<number>`(select count(*)::int from ${s.orders} o where o.user_id = "users"."id" and o.status <> 'PENDING_PAYMENT')`,
    spent: sql<number>`(select coalesce(sum(o.total),0)::int from ${s.orders} o where o.user_id = "users"."id" and o.status not in ('PENDING_PAYMENT','CANCELLED'))`,
  }).from(s.users).where(q ? or(ilike(s.users.name, `%${q}%`), ilike(s.users.email, `%${q}%`), ilike(s.users.phone, `%${q}%`)) : undefined).orderBy(desc(s.users.createdAt)).limit(300);
  return (
    <>
      <AdminHeader title="Customers" sub="Registered accounts. Guest orders appear under Orders." actions={<a href="/api/admin/export?type=customers" className="btn-outline btn-sm"><Download className="h-3.5 w-3.5" /> Export CSV</a>} />
      <form className="relative mb-4 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input name="q" defaultValue={q} placeholder="Search name, email, phone" className="input pl-9" /></form>
      <Table head={["Name", "Contact", "Joined", "Orders", "Spent", "Role", ""]} empty={!rows.length}>
        {rows.map(({ u, orders, spent }) => (
          <tr key={u.id}>
            <td className={`${td} font-medium`}>{u.name}</td>
            <td className={`${td} text-xs`}>{u.email}<br /><span className="text-muted">{u.phone}</span></td>
            <td className={`${td} text-xs text-muted`}>{fmtDate(u.createdAt)}</td>
            <td className={td}>{orders}</td>
            <td className={td}>{inr(spent)}</td>
            <td className={td}><Badge v={u.role === "ADMIN" ? "CONFIRMED" : "PENDING"} label={u.role === "ADMIN" ? "Admin" : "Customer"} /></td>
            <td className={`${td} text-right`}>
              {u.id !== me?.uid && (
                <form action={setUserRole}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="role" value={u.role === "ADMIN" ? "CUSTOMER" : "ADMIN"} />
                  <Submit className="text-xs font-semibold text-teak-dark" confirm={u.role === "ADMIN" ? "Remove admin access?" : "Give this user full admin access?"}>{u.role === "ADMIN" ? "Remove admin" : "Make admin"}</Submit></form>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
