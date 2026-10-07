import { desc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Badge, Check, Field, Flash, Panel, Table, td } from "@/components/admin/ui";
import { Submit } from "@/components/admin/inputs";
import { deleteCoupon, saveCoupon } from "@/lib/admin-actions";
import { fmtDate, inr } from "@/lib/format";

export const metadata = { title: "Coupons" };

export default async function Coupons({ searchParams }: { searchParams: Promise<{ saved?: string; edit?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select().from(s.coupons).orderBy(desc(s.coupons.createdAt));
  const e = rows.find((r) => r.id === sp.edit);
  return (
    <>
      <AdminHeader title="Coupons" sub="Discount codes customers can apply in the cart." />
      <Flash show={sp.saved} />
      <Panel title={e ? `Edit ${e.code}` : "Create coupon"} className="mb-6">
        <form action={saveCoupon} className="grid gap-3 md:grid-cols-4" key={e?.id || "new"}>
          {e && <input type="hidden" name="id" value={e.id} />}
          <Field label="Code *"><input name="code" required defaultValue={e?.code} className="input uppercase" placeholder="DIWALI10" /></Field>
          <Field label="Type"><select name="type" defaultValue={e?.type || "PERCENT"} className="input"><option value="PERCENT">% off</option><option value="FLAT">₹ flat off</option></select></Field>
          <Field label="Value *"><input name="value" type="number" required min={1} defaultValue={e?.value} className="input" /></Field>
          <Field label="Min. order (₹)"><input name="minOrder" type="number" min={0} defaultValue={e?.minOrder ?? 0} className="input" /></Field>
          <Field label="Max discount (₹)" hint="For % coupons"><input name="maxDiscount" type="number" min={0} defaultValue={e?.maxDiscount ?? ""} className="input" /></Field>
          <Field label="Usage limit"><input name="usageLimit" type="number" min={1} defaultValue={e?.usageLimit ?? ""} className="input" placeholder="Unlimited" /></Field>
          <Field label="Expires on"><input name="expiresAt" type="date" defaultValue={e?.expiresAt ? e.expiresAt.toISOString().slice(0, 10) : ""} className="input" /></Field>
          <div className="flex flex-col justify-end gap-2"><Check name="active" label="Active" defaultChecked={e ? e.active : true} /><Check name="loginOnly" label="Logged-in customers only" defaultChecked={e?.loginOnly} /></div>
          <div className="md:col-span-4"><Submit className="btn-gold btn-sm">{e ? "Save coupon" : "Create coupon"}</Submit>{e && <a href="/admin/coupons" className="ml-3 text-sm text-muted">Cancel</a>}</div>
        </form>
      </Panel>
      <Table head={["Code", "Discount", "Conditions", "Used", "Expires", "Status", ""]} empty={!rows.length}>
        {rows.map((c) => (
          <tr key={c.id}>
            <td className={`${td} font-mono font-bold`}>{c.code}</td>
            <td className={td}>{c.type === "FLAT" ? inr(c.value) : `${c.value}%`}{c.maxDiscount ? ` (max ${inr(c.maxDiscount)})` : ""}</td>
            <td className={`${td} text-xs text-muted`}>{c.minOrder ? `Min ${inr(c.minOrder)}` : "No minimum"}{c.loginOnly ? " · Login only" : ""}</td>
            <td className={td}>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
            <td className={`${td} text-xs`}>{c.expiresAt ? fmtDate(c.expiresAt) : "Never"}</td>
            <td className={td}><Badge v={c.active ? "PAID" : "PENDING"} label={c.active ? "Active" : "Off"} /></td>
            <td className={`${td} whitespace-nowrap text-right`}>
              <a href={`/admin/coupons?edit=${c.id}`} className="btn-outline btn-sm mr-1">Edit</a>
              <form action={deleteCoupon} className="inline"><input type="hidden" name="id" value={c.id} /><Submit className="btn-outline btn-sm !text-sale" confirm="Delete coupon?">Delete</Submit></form>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
