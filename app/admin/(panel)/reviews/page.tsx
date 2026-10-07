import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Badge, Check, Field, Flash, Panel } from "@/components/admin/ui";
import { Submit } from "@/components/admin/inputs";
import { addReview, updateReview } from "@/lib/admin-actions";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Reviews" };

export default async function Reviews({ searchParams }: { searchParams: Promise<{ saved?: string; f?: string }> }) {
  const sp = await searchParams;
  const rows = await db.query.reviews.findMany({ where: sp.f === "pending" ? eq(s.reviews.approved, false) : undefined, orderBy: desc(s.reviews.createdAt), with: { product: { columns: { name: true, slug: true } } }, limit: 200 });
  const products = await db.select({ id: s.products.id, name: s.products.name }).from(s.products).orderBy(asc(s.products.name));
  return (
    <>
      <AdminHeader title="Reviews" sub="New customer reviews wait for your approval. Star a review to show it on the homepage." actions={<Link href={sp.f === "pending" ? "/admin/reviews" : "/admin/reviews?f=pending"} className="btn-outline btn-sm">{sp.f === "pending" ? "Show all" : "Pending only"}</Link>} />
      <Flash show={sp.saved} />
      <details className="mb-5 rounded-2xl border border-dashed border-teak bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-teak-dark">+ Add a customer review (e.g. from WhatsApp or Google)</summary>
        <form action={addReview} className="mt-4 grid gap-3 md:grid-cols-3">
          <Field label="Product (optional)"><select name="productId" className="input"><option value="">— General store review —</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Customer name *"><input name="name" required className="input" /></Field>
          <Field label="City"><input name="city" className="input" /></Field>
          <Field label="Rating"><select name="rating" defaultValue="5" className="input">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select></Field>
          <Field label="Review *" className="md:col-span-2"><textarea name="text" required rows={2} className="input" /></Field>
          <div className="flex items-center gap-4 md:col-span-3"><Check name="showOnHome" label="Show on homepage" defaultChecked /><Submit className="btn-gold btn-sm">Add review</Submit></div>
        </form>
      </details>
      <div className="space-y-3">
        {rows.length === 0 && <Panel><p className="text-center text-sm text-muted">No reviews yet.</p></Panel>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-teak text-teak" : "text-line"}`} />)}</span>
              <b className="text-sm">{r.name}</b><span className="text-xs text-muted">{r.city} · {fmtDate(r.createdAt)}</span>
              <Badge v={r.approved ? "PAID" : "NEW"} label={r.approved ? "Approved" : "Pending"} />
              {r.showOnHome && <Badge v="CONFIRMED" label="On homepage" />}
            </div>
            <p className="mt-2 text-sm">{r.text}</p>
            {r.product && <p className="mt-1 text-xs text-muted">on <Link className="underline" href={`/product/${r.product.slug}`} target="_blank">{r.product.name}</Link></p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {(["approve", "hide", "home", "delete"] as const).filter((a) => !(a === "approve" && r.approved) && !(a === "hide" && !r.approved)).map((a) => (
                <form key={a} action={updateReview}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="action" value={a} />
                  <Submit className={`btn-outline btn-sm ${a === "delete" ? "!text-sale" : ""}`} confirm={a === "delete" ? "Delete this review?" : undefined}>{a === "approve" ? "Approve" : a === "hide" ? "Unapprove" : a === "home" ? (r.showOnHome ? "Remove from home" : "Show on home") : "Delete"}</Submit>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
