import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categoryCounts, listProducts, woodTypes, type ShopQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { PageHero } from "@/components/ui";
import { ActiveChips, ClearAll, FilterPanel, MobileFilterBar, SortSelect, ViewToggle } from "@/components/shop-filters";

export const metadata = { title: "Shop Solid Wood Furniture" };

export default async function Shop({ searchParams }: { searchParams: Promise<ShopQuery & { view?: string }> }) {
  const q = await searchParams;
  const [res, cats, woods] = await Promise.all([listProducts(q), categoryCounts(), woodTypes()]);
  const catNames = Object.fromEntries(cats.map((c) => [c.slug, c.name]));
  const activeCount = ["category", "wood", "min", "max", "discount", "rating"].reduce((a, k) => a + (q[k as keyof ShopQuery] ? 1 : 0), 0);
  const href = (page: number) => {
    const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]);
    p.set("page", String(page));
    return `/shop?${p.toString()}`;
  };
  const singleCat = q.category && !q.category.includes(",") ? catNames[q.category] : null;
  const pages = pageList(res.page, res.pages);
  return (
    <>
      <PageHero
        eyebrow={q.q ? "Search results" : singleCat ? "Category" : "All furniture"}
        title={q.q ? `Results for “${q.q}”` : singleCat || "Shop Solid Wood Furniture"}
        sub="Handcrafted beds, seating, tables, storage and décor — up to 50% off, with free shipping across India."
        crumbs={[{ href: "/", label: "Home" }, { href: singleCat ? "/shop" : undefined, label: "Shop" }, ...(singleCat ? [{ label: singleCat }] : [])]}
      />
      <div className="container-site grid gap-8 py-8 md:py-10 lg:grid-cols-[260px_1fr]">
        <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
          <div className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-serif text-2xl font-semibold">Filters</p>
              <ClearAll />
            </div>
            <Suspense><FilterPanel cats={cats} woods={woods} /></Suspense>
          </div>
        </aside>
        <div>
          <Suspense><MobileFilterBar cats={cats} woods={woods} count={activeCount} /></Suspense>
          <div className="mt-4 flex items-center justify-between gap-3 lg:mt-0">
            <p className="text-sm text-muted"><b className="text-ink">{res.total}</b> products</p>
            <div className="hidden items-center gap-2 lg:flex">
              <Suspense><SortSelect /><ViewToggle /></Suspense>
            </div>
          </div>
          <div className="mt-3"><Suspense><ActiveChips catNames={catNames} /></Suspense></div>
          {res.items.length === 0 ? (
            <div className="card mt-6 p-12 text-center">
              <p className="font-serif text-2xl">No products match these filters</p>
              <p className="mt-2 text-sm text-muted">Try removing a filter, or tell us what you need — we can make it to order.</p>
              <div className="mt-5 flex justify-center gap-3"><Link href="/shop" className="btn-outline">Clear filters</Link><Link href="/custom-order" className="btn-gold">Custom order</Link></div>
            </div>
          ) : q.view === "list" ? (
            <div className="mt-5 grid gap-4">{res.items.map((p) => <ProductCard key={p.id} p={p} list />)}</div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">{res.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          )}
          {res.pages > 1 && (
            <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
              <PageLink href={href(res.page - 1)} disabled={res.page <= 1}><ChevronLeft className="h-4 w-4" /></PageLink>
              {pages.map((p, i) => p === "…" ? <span key={i} className="grid h-10 w-10 place-items-center rounded-lg border border-line text-muted">…</span> : <PageLink key={i} href={href(p)} active={p === res.page}>{p}</PageLink>)}
              <PageLink href={href(res.page + 1)} disabled={res.page >= res.pages}><ChevronRight className="h-4 w-4" /></PageLink>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}

function pageList(cur: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set([1, total, cur, cur - 1, cur + 1].filter((x) => x >= 1 && x <= total));
  const arr = [...s].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  arr.forEach((n, i) => { if (i && n - arr[i - 1] > 1) out.push("…"); out.push(n); });
  return out;
}

function PageLink({ href, children, active, disabled }: { href: string; children: React.ReactNode; active?: boolean; disabled?: boolean }) {
  const cls = `grid h-10 min-w-10 place-items-center rounded-lg border px-2 text-sm ${active ? "border-ink bg-ink text-white" : "border-line hover:border-teak"} ${disabled ? "pointer-events-none opacity-40" : ""}`;
  return <Link href={href} className={cls} aria-current={active ? "page" : undefined}>{children}</Link>;
}
