import { desc } from "drizzle-orm";
import { Download } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Table, td } from "@/components/admin/ui";
import { Submit } from "@/components/admin/inputs";
import { deleteSubscriber } from "@/lib/admin-actions";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Subscribers" };

export default async function Subscribers() {
  const rows = await db.select().from(s.subscribers).orderBy(desc(s.subscribers.createdAt));
  return (
    <>
      <AdminHeader title="Newsletter subscribers" sub={`${rows.length} subscribers`} actions={<a href="/api/admin/export?type=subscribers" className="btn-outline btn-sm"><Download className="h-3.5 w-3.5" /> Export CSV</a>} />
      <Table head={["Email", "Subscribed", ""]} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.id}><td className={td}>{r.email}</td><td className={`${td} text-muted`}>{fmtDate(r.createdAt)}</td>
            <td className={`${td} text-right`}><form action={deleteSubscriber}><input type="hidden" name="id" value={r.id} /><Submit className="text-xs text-sale" confirm="Remove subscriber?">Remove</Submit></form></td></tr>
        ))}
      </Table>
    </>
  );
}
