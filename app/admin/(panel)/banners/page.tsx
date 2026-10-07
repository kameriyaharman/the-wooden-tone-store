import { asc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Check, Field, Flash } from "@/components/admin/ui";
import { ImageList, Submit } from "@/components/admin/inputs";
import { deleteBanner, saveBanner } from "@/lib/admin-actions";

export const metadata = { title: "Banners" };

export default async function Banners({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const rows = await db.select().from(s.banners).orderBy(asc(s.banners.placement), asc(s.banners.sortOrder));
  return (
    <>
      <AdminHeader title="Banners" sub="HERO = homepage slider. PROMO = the two large image tiles below “Now trending”." />
      <Flash show={sp.saved} />
      <div className="space-y-3">
        <details className="rounded-2xl border border-dashed border-teak bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-teak-dark">+ Add banner</summary><BannerForm /></details>
        {rows.map((b) => (
          <details key={b.id} className="rounded-2xl border border-line bg-white">
            <summary className="flex cursor-pointer items-center gap-3 p-3">
              <img src={b.image} alt="" className="h-14 w-24 rounded-lg object-cover" />
              <span className="flex-1"><b className="text-sm">{b.title} {b.highlight}</b><span className="block text-xs text-muted">{b.placement} · order {b.sortOrder}{b.active ? "" : " · Hidden"}</span></span>
              <span className="text-xs font-semibold text-teak-dark">Edit</span>
            </summary>
            <div className="border-t border-line p-4">
              <BannerForm b={b} />
              <form action={deleteBanner} className="mt-3"><input type="hidden" name="id" value={b.id} /><Submit className="text-xs font-semibold text-sale" confirm="Delete banner?">Delete banner</Submit></form>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}

function BannerForm({ b }: { b?: typeof s.banners.$inferSelect }) {
  return (
    <form action={saveBanner} className="mt-4 grid gap-3 md:grid-cols-2">
      {b && <input type="hidden" name="id" value={b.id} />}
      <div className="md:col-span-2"><p className="label">Image * (wide, at least 1600px)</p><ImageList name="image" single initial={b ? [b.image] : []} /></div>
      <Field label="Placement"><select name="placement" defaultValue={b?.placement || "HERO"} className="input"><option value="HERO">HERO — home slider</option><option value="PROMO">PROMO — home image tile</option></select></Field>
      <Field label="Small text above title"><input name="eyebrow" defaultValue={b?.eyebrow || ""} className="input" /></Field>
      <Field label="Title *"><input name="title" required defaultValue={b?.title} className="input" /></Field>
      <Field label="Highlighted line (gold italic)"><input name="highlight" defaultValue={b?.highlight || ""} className="input" /></Field>
      <Field label="Subtitle" className="md:col-span-2"><input name="subtitle" defaultValue={b?.subtitle || ""} className="input" /></Field>
      <Field label="Button text"><input name="ctaLabel" defaultValue={b?.ctaLabel || ""} className="input" /></Field>
      <Field label="Button link" hint="e.g. /shop?category=beds"><input name="ctaLink" defaultValue={b?.ctaLink || ""} className="input" /></Field>
      <Field label="Second button text"><input name="cta2Label" defaultValue={b?.cta2Label || ""} className="input" /></Field>
      <Field label="Second button link"><input name="cta2Link" defaultValue={b?.cta2Link || ""} className="input" /></Field>
      <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={b?.sortOrder ?? 0} className="input" /></Field>
      <div className="flex items-end justify-between"><Check name="active" label="Active" defaultChecked={b ? b.active : true} /><Submit className="btn-gold btn-sm">Save banner</Submit></div>
    </form>
  );
}
