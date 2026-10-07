import Link from "next/link";
import { and, asc, desc, eq, ilike, lte, or, type SQL } from "drizzle-orm";
import { Copy, Eye, EyeOff, Pencil, Search } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Flash, Pager, Table, td } from "@/components/admin/ui";
import { Submit } from "@/components/admin/inputs";
import { duplicateProduct, quickUpdateProduct } from "@/lib/admin-actions";
import { inr } from "@/lib/format";

export const metadata = { title: "Products" };
const PER = 30;

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; stock?: string; status?: string; page?: string; saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, +(sp.page || 1));
  const where: SQL[] = [];
  if (sp.q) { const t = `%${sp.q}%`; where.push(or(ilike(s.products.name, t), ilike(s.products.sku, t))!); }
  if (sp.cat) where.push(eq(s.products.categoryId, sp.cat));
  if (sp.stock === "low") where.push(lte(s.products.stock, 3));
  if (sp.status === "hidden") where.push(eq(s.products.active, false));
  if (sp.status === "live") where.push(eq(s.products.active, true));
  const w = where.length ? and(...where) : undefined;
  const [rows, total, cats] = await Promise.all([
    db.query.products.findMany({ where: w, orderBy: [desc(s.products.updatedAt)], limit: PER, offset: (page - 1) * PER, with: { category: { columns: { name: true } } } }),
    db.$count(s.products, w),
    db.select({ id: s.categories.id, name: s.categories.name }).from(s.categories).orderBy(asc(s.categories.name)),
  ]);
  const qs = new URLSearchParams(Object.entries({ q: sp.q, cat: sp.cat, stock: sp.stock, status: sp.status }).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <>
      <AdminHeader title="Products" sub={`${total} products`} actions={<Link href="/admin/products/new" className="btn-gold btn-sm">+ Add product</Link>} />
      <Flash show={sp.saved} msg="Product saved." />
      <Flash show={sp.deleted} msg="Product deleted." />
      <form className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input name="q" defaultValue={sp.q} placeholder="Search name or SKU" className="input pl-9" /></div>
        <select name="cat" defaultValue={sp.cat || ""} className="input !w-auto"><option value="">All categories</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select name="status" defaultValue={sp.status || ""} className="input !w-auto"><option value="">Live &amp; hidden</option><option value="live">Live only</option><option value="hidden">Hidden only</option></select>
        <select name="stock" defaultValue={sp.stock || ""} className="input !w-auto"><option value="">Any stock</option><option value="low">Low stock (≤3)</option></select>
        <button className="btn-dark btn-sm">Filter</button>
      </form>
      <Table head={["", "Product", "Category", "Price", "Stock", "Status", ""]} empty={!rows.length}>
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-cream/50">
            <td className={`${td} w-14`}>{p.images[0] ? <img src={p.images[0]} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <div className="h-11 w-11 rounded-lg bg-cream" />}</td>
            <td className={td}><Link href={`/admin/products/${p.id}`} className="font-medium hover:text-teak-dark">{p.name}</Link><p className="text-xs text-muted">{p.sku}{p.featured ? " · Featured" : ""}{p.trending ? " · Trending" : ""}</p></td>
            <td className={`${td} text-muted`}>{p.category?.name || "—"}</td>
            <td className={td}><b>{inr(p.price)}</b>{p.mrp > p.price && <span className="ml-1 text-xs text-muted line-through">{inr(p.mrp)}</span>}</td>
            <td className={td}>
              <form action={quickUpdateProduct} className="flex items-center gap-1">
                <input type="hidden" name="id" value={p.id} />
                <input name="stock" type="number" defaultValue={p.stock} className={`input !w-20 !py-1.5 ${p.stock <= 0 ? "!border-sale text-sale" : p.stock <= 3 ? "!border-[#E9A65E]" : ""}`} aria-label="Stock" />
                <Submit className="btn-outline btn-sm !px-2">Save</Submit>
              </form>
            </td>
            <td className={td}>
              <form action={quickUpdateProduct}>
                <input type="hidden" name="id" value={p.id} /><input type="hidden" name="toggleActive" value="1" />
                <button className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.active ? "bg-[#E8F5EE] text-stock" : "bg-cream text-muted"}`}>{p.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}{p.active ? "Live" : "Hidden"}</button>
              </form>
            </td>
            <td className={`${td} whitespace-nowrap text-right`}>
              <Link href={`/admin/products/${p.id}`} className="btn-outline btn-sm mr-1 !px-2" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Link>
              <form action={duplicateProduct} className="inline"><input type="hidden" name="id" value={p.id} /><button className="btn-outline btn-sm !px-2" aria-label="Duplicate" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button></form>
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} pages={Math.ceil(total / PER)} base={`/admin/products?${qs}`} />
    </>
  );
}
