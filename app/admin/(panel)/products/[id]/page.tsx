import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Check, Field, Panel } from "@/components/admin/ui";
import { ImageList, Repeater, SlugField, Submit } from "@/components/admin/inputs";
import { deleteProduct, saveProduct } from "@/lib/admin-actions";

export default async function ProductForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const p = isNew ? null : await db.query.products.findFirst({ where: eq(s.products.id, id) });
  if (!isNew && !p) notFound();
  const cats = await db.select({ id: s.categories.id, name: s.categories.name }).from(s.categories).orderBy(asc(s.categories.name));
  const woods = ["Sheesham", "Teak", "Mango Wood", "Acacia", "Rosewood", "Pine", "Engineered Wood"];
  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Products</Link>
      <AdminHeader title={isNew ? "Add product" : "Edit product"} actions={p && <a href={`/product/${p.slug}`} target="_blank" className="btn-outline btn-sm"><ExternalLink className="h-3.5 w-3.5" /> View on store</a>} />
      <form action={saveProduct} className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="space-y-5">
          <Panel title="Basic details">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product name *" className="md:col-span-2"><input name="name" required defaultValue={p?.name} className="input" /></Field>
              <Field label="URL slug" hint="Leave empty to generate from the name"><SlugField initial={p?.slug} source="name" /></Field>
              <Field label="SKU"><input name="sku" defaultValue={p?.sku || ""} className="input" /></Field>
              <Field label="Short description" className="md:col-span-2"><input name="shortDesc" defaultValue={p?.shortDesc || ""} className="input" /></Field>
              <Field label="Description" className="md:col-span-2" hint="Leave a blank line between paragraphs"><textarea name="description" rows={6} defaultValue={p?.description || ""} className="input" /></Field>
              <Field label="Key features (one per line)" className="md:col-span-2"><textarea name="bullets" rows={4} defaultValue={p?.bullets.join("\n")} className="input" /></Field>
            </div>
          </Panel>
          <Panel title="Images" actions={<span className="text-xs text-muted">First image is the main photo. Drag &amp; drop or click to upload.</span>}>
            <ImageList name="images" initial={p?.images || []} />
          </Panel>
          <Panel title="Options">
            <p className="label">Finishes (colour swatches)</p>
            <Repeater name="finishes" initial={(p?.finishes as Record<string, unknown>[]) || [{ name: "Natural Honey", color: "#B9803F" }]} cols={[{ key: "color", label: "Colour", type: "color" }, { key: "name", label: "Finish name" }]} addLabel="Add finish" />
            <p className="label mt-5">Sizes (optional — price change is added to the base price)</p>
            <Repeater name="sizes" initial={(p?.sizes as Record<string, unknown>[]) || []} cols={[{ key: "name", label: "Size", placeholder: "e.g. Queen", width: "w-28" }, { key: "label", label: "Label", placeholder: "Queen (60 × 78 in)" }, { key: "priceDelta", label: "± Price", type: "number", width: "w-28" }]} addLabel="Add size" />
          </Panel>
          <Panel title="Specifications">
            <Repeater name="specs" initial={(p?.specs as Record<string, unknown>[]) || [{ label: "Material", value: "" }, { label: "Dimensions", value: "" }, { label: "Warranty", value: "1 year manufacturing" }]} cols={[{ key: "label", label: "Label", width: "w-40" }, { key: "value", label: "Value" }]} addLabel="Add specification" />
            <Field label="Care instructions" className="mt-4"><textarea name="careText" rows={3} defaultValue={p?.careText || ""} className="input" /></Field>
          </Panel>
        </div>
        <div className="space-y-5">
          <Panel title="Pricing & stock">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Selling price (₹) *"><input name="price" type="number" required min={0} defaultValue={p?.price} className="input" /></Field>
              <Field label="MRP (₹)"><input name="mrp" type="number" min={0} defaultValue={p?.mrp} className="input" /></Field>
              <Field label="Stock qty"><input name="stock" type="number" min={0} defaultValue={p?.stock ?? 10} className="input" /></Field>
              <Field label="Ships in"><input name="shipsIn" defaultValue={p?.shipsIn || "7–10 days"} className="input" /></Field>
            </div>
          </Panel>
          <Panel title="Organisation">
            <div className="space-y-3">
              <Field label="Category"><select name="categoryId" defaultValue={p?.categoryId || ""} className="input"><option value="">— None —</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Wood type"><input name="woodType" list="woods" defaultValue={p?.woodType || ""} className="input" /><datalist id="woods">{woods.map((w) => <option key={w} value={w} />)}</datalist></Field>
              <Field label="Sort order" hint="Lower numbers show first"><input name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} className="input" /></Field>
            </div>
          </Panel>
          <Panel title="Visibility">
            <div className="space-y-2.5">
              <Check name="active" label="Live on store" defaultChecked={p ? p.active : true} />
              <Check name="trending" label="Show in “Now trending” on home" defaultChecked={p?.trending} />
              <Check name="featured" label="Show in “Featured collection” on home" defaultChecked={p?.featured} />
            </div>
          </Panel>
          <div className="sticky bottom-4 flex gap-2 rounded-2xl border border-line bg-white p-3 shadow-card">
            <Submit className="btn-gold flex-1">{isNew ? "Create product" : "Save changes"}</Submit>
          </div>
        </div>
      </form>
      {p && (
        <form action={deleteProduct} className="mt-8 border-t border-line pt-5">
          <input type="hidden" name="id" value={p.id} />
          <Submit className="btn-outline btn-sm !text-sale" confirm="Delete this product permanently? Past orders keep their details.">Delete product</Submit>
        </form>
      )}
    </>
  );
}
