import { notFound } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { cardCols } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs, Paragraphs, SectionHead } from "@/components/ui";
import { ProductCard, Stars } from "@/components/product-card";
import { BuyBox, Gallery, ReviewForm, Tabs } from "@/components/product-detail";
import { fmtDate } from "@/lib/format";
import { Box, Layers, Paintbrush, Ruler, ShieldCheck, Trees, Wrench, BedDouble, Package } from "lucide-react";

const specIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes("material") || l.includes("wood")) return Trees;
  if (l.includes("finish") || l.includes("colour") || l.includes("color")) return Paintbrush;
  if (l.includes("dimension")) return Ruler;
  if (l.includes("size")) return BedDouble;
  if (l.includes("storage")) return Box;
  if (l.includes("assembl")) return Wrench;
  if (l.includes("warrant")) return ShieldCheck;
  if (l.includes("weight")) return Package;
  return Layers;
};

async function getProduct(slug: string) {
  return db.query.products.findFirst({ where: and(eq(s.products.slug, slug), eq(s.products.active, true)), with: { category: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  return { title: p.name, description: p.shortDesc || undefined, openGraph: { images: p.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const st = await getSettings();
  const [related, reviews] = await Promise.all([
    p.categoryId
      ? db.select(cardCols).from(s.products).where(and(eq(s.products.categoryId, p.categoryId), eq(s.products.active, true), ne(s.products.id, p.id))).limit(5)
      : Promise.resolve([]),
    db.select().from(s.reviews).where(and(eq(s.reviews.productId, p.id), eq(s.reviews.approved, true))).orderBy(desc(s.reviews.createdAt)).limit(20),
  ]);
  const more = related.length < 5
    ? await db.select(cardCols).from(s.products).where(and(eq(s.products.active, true), ne(s.products.id, p.id), eq(s.products.trending, true))).limit(5 - related.length)
    : [];
  const recs = [...related, ...more.filter((m) => !related.some((r) => r.id === m.id))];
  const defSize = p.sizes.find((x) => x.priceDelta === 0) || p.sizes[0];
  const specLine = [p.woodType && `${p.woodType} Wood`, defSize && `${defSize.name} Size`].filter(Boolean).join(" · ");
  const specs = (
    <table className="w-full overflow-hidden rounded-xl text-sm">
      <tbody>
        {p.specs.map((x) => (
          <tr key={x.label} className="border-b border-line last:border-0">
            <td className="w-[40%] bg-cream px-4 py-3 text-muted"><span className="flex items-center gap-2">{(() => { const I = specIcon(x.label); return <I className="h-3.5 w-3.5 text-teak" />; })()}{x.label}</span></td>
            <td className="px-4 py-3">{x.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, image: p.images, sku: p.sku, description: p.shortDesc,
    offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };
  return (
    <div className="container-site pb-24 pt-6 md:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/shop", label: "Shop" }, ...(p.category ? [{ href: `/shop?category=${p.category.slug}`, label: p.category.name }] : []), { label: p.name.replace(/^The Wooden Tone /, "") }]} />
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="lg:sticky lg:top-24"><Gallery images={p.images} name={p.name} /></div>
        <BuyBox
          p={{ id: p.id, slug: p.slug, name: p.name, price: p.price, mrp: p.mrp, images: p.images, stock: p.stock, woodType: p.woodType, finishes: p.finishes, sizes: p.sizes, shipsIn: p.shipsIn, ratingAvg: p.ratingAvg, ratingCount: p.ratingCount }}
          specLine={specLine}
        />
      </div>

      <div className="mt-10">
        <Tabs
          tabs={[
            {
              key: "desc", label: "Description",
              content: (
                <div className="grid gap-8 md:grid-cols-2">
                  <div>
                    <h2 className="h-display text-[28px]">{p.shortDesc ? "Crafted to last" : p.name}</h2>
                    <Paragraphs text={p.description} className="mt-3 text-[15px] text-muted" />
                    {p.bullets.length > 0 && <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[15px] text-ink">{p.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
                  </div>
                  {p.specs.length > 0 && <div>{specs}</div>}
                </div>
              ),
            },
            { key: "spec", label: "Specifications", content: p.specs.length ? specs : <p className="text-sm text-muted">Specifications coming soon.</p> },
            { key: "ship", label: "Shipping & Returns", content: <div className="max-w-2xl text-[15px] text-muted"><p>Ships in {p.shipsIn}. Free delivery across India — large furniture is delivered and assembled by our team.</p><p className="mt-3">If your piece arrives damaged or differs from your order, tell us within 7 days with photos and we will repair, replace or refund it.</p></div> },
            { key: "care", label: "Care", content: <Paragraphs text={p.careText || "Dust with a soft dry cloth and keep away from direct sunlight."} className="max-w-2xl text-[15px] text-muted" /> },
            {
              key: "reviews", label: `Reviews (${reviews.length})`,
              content: (
                <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                  <div className="space-y-4">
                    {reviews.length === 0 && <p className="text-sm text-muted">No reviews yet. Be the first to share your experience.</p>}
                    {reviews.map((r) => (
                      <div key={r.id} className="border-b border-line pb-4">
                        <div className="flex items-center justify-between"><p className="text-sm font-bold">{r.name}{r.city && <span className="font-normal text-muted"> · {r.city}</span>}</p><span className="text-xs text-muted">{fmtDate(r.createdAt)}</span></div>
                        <div className="mt-1"><Stars value={r.rating} /></div>
                        <p className="mt-2 text-sm text-muted">{r.text}</p>
                      </div>
                    ))}
                  </div>
                  <ReviewForm productId={p.id} />
                </div>
              ),
            },
          ]}
        />
      </div>

      {recs.length > 0 && (
        <section className="mt-14">
          <SectionHead eyebrow="You may also like" title={p.category ? `More from ${p.category.name}` : "You may also like"} href={p.category ? `/shop?category=${p.category.slug}` : "/shop"} />
          <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:px-0">
            {recs.map((r) => <div key={r.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-auto"><ProductCard p={r} /></div>)}
          </div>
        </section>
      )}
      <p className="sr-only">{st.storeName}</p>
    </div>
  );
}
