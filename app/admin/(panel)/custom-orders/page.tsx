import { desc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { Submit } from "@/components/admin/inputs";
import { updateCustomOrder } from "@/lib/admin-actions";
import { fmtDate } from "@/lib/format";
import { WhatsappIcon } from "@/components/icons";

export const metadata = { title: "Custom Orders" };

export default async function CustomOrders() {
  const rows = await db.select().from(s.customOrders).orderBy(desc(s.customOrders.createdAt)).limit(200);
  return (
    <>
      <AdminHeader title="Custom order requests" sub="Quote requests from the Custom Order page." />
      <div className="space-y-3">
        {rows.length === 0 && <Panel><p className="text-center text-sm text-muted">No custom order requests yet.</p></Panel>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center gap-2"><b>{r.itemType}</b><span className="text-sm text-muted">· {r.wood} · {r.width}×{r.depth}{r.height ? `×${r.height}` : ""} in · {r.budget}</span><Badge v={r.status} /><span className="ml-auto text-xs text-muted">{fmtDate(r.createdAt, true)}</span></div>
            <p className="mt-2 text-sm"><b>{r.name}</b> · <a href={`tel:${r.phone}`} className="underline">{r.phone}</a>
              <a href={`https://wa.me/${r.phone.replace(/\D/g, "").replace(/^(?=\d{10}$)/, "91")}?text=${encodeURIComponent(`Hi ${r.name}, thanks for your custom ${r.itemType} request at The Wooden Tone. `)}`} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-stock"><WhatsappIcon className="h-3.5 w-3.5" /> WhatsApp</a></p>
            {r.notes && <p className="mt-1 text-sm text-muted">{r.notes}</p>}
            {r.images.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{r.images.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" className="h-20 w-20 rounded-lg object-cover" /></a>)}</div>}
            <form action={updateCustomOrder} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={r.id} />
              <select name="status" defaultValue={r.status} className="input !w-auto"><option value="NEW">New</option><option value="QUOTED">Quoted</option><option value="CONFIRMED">Confirmed</option><option value="CLOSED">Closed</option></select>
              <input name="adminNote" defaultValue={r.adminNote || ""} placeholder="Internal note / quoted price" className="input min-w-[200px] flex-1" />
              <Submit className="btn-dark btn-sm">Save</Submit>
            </form>
          </div>
        ))}
      </div>
    </>
  );
}
