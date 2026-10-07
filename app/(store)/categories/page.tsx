import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { PageHero } from "@/components/ui";
import { CategoryGrid } from "@/components/category-grid";

export const metadata = { title: "Shop by Category" };

export default async function Categories() {
  const [cats, rooms] = await Promise.all([
    db.select({ slug: s.categories.slug, name: s.categories.name, image: s.categories.image }).from(s.categories).where(eq(s.categories.active, true)).orderBy(asc(s.categories.name)),
    db.select({
      slug: s.rooms.slug, name: s.rooms.name, image: s.rooms.image, description: s.rooms.description,
      n: sql<number>`(select count(*)::int from ${s.products} p join ${s.categories} c on c.id = p.category_id where c.room_id = "rooms"."id" and p.active)`,
    }).from(s.rooms).where(eq(s.rooms.showOnHome, true)).orderBy(asc(s.rooms.sortOrder)),
  ]);
  return (
    <>
      <PageHero eyebrow={`${cats.length}+ categories`} title="Shop by Category" sub="Find the right piece for every corner of your home — living, bedroom, dining, kitchen and décor." crumbs={[{ href: "/", label: "Home" }, { label: "Shop by Category" }]} />
      <div className="container-site py-10 md:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {rooms.map((r) => (
            <Link key={r.slug} href={`/shop?room=${r.slug}`} className="group relative block h-44 overflow-hidden rounded-2xl md:h-56">
              {r.image && <img src={r.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-0 p-5 text-white">
                <p className="font-serif text-3xl font-semibold">{r.name}</p>
                <p className="mt-1 text-xs text-white/80">{r.description} · {r.n} products</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-14 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">A – Z</p>
        <h2 className="h-display mt-1 text-[36px] md:text-[44px]">All Categories</h2>
        <CategoryGrid cats={cats} />
      </div>
    </>
  );
}
