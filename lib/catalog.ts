import "server-only";
import { db, schema as s } from "./db";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const cardCols = {
  id: s.products.id,
  name: s.products.name,
  slug: s.products.slug,
  price: s.products.price,
  mrp: s.products.mrp,
  images: s.products.images,
  stock: s.products.stock,
  ratingAvg: s.products.ratingAvg,
  ratingCount: s.products.ratingCount,
  hasOptions: sql<boolean>`(jsonb_array_length(${s.products.sizes}) > 0)`,
};
export type CardProduct = {
  id: string; name: string; slug: string; price: number; mrp: number; images: string[];
  stock: number; ratingAvg: number; ratingCount: number; hasOptions: boolean;
};

export async function productsByCategory(categoryId: string, limit = 10) {
  return db.select(cardCols).from(s.products)
    .where(and(eq(s.products.active, true), eq(s.products.categoryId, categoryId)))
    .orderBy(asc(s.products.sortOrder), desc(s.products.createdAt)).limit(limit);
}

export type ShopQuery = {
  category?: string; room?: string; wood?: string; min?: string; max?: string;
  discount?: string; rating?: string; q?: string; sort?: string; page?: string;
};

export const PAGE_SIZE = 16;

export async function listProducts(q: ShopQuery) {
  const where: SQL[] = [eq(s.products.active, true)];
  const catSlugs = (q.category || "").split(",").filter(Boolean);
  if (catSlugs.length) {
    const cats = await db.select({ id: s.categories.id }).from(s.categories).where(inArray(s.categories.slug, catSlugs));
    where.push(inArray(s.products.categoryId, cats.length ? cats.map((c) => c.id) : ["__none__"]));
  }
  if (q.room) {
    const room = await db.query.rooms.findFirst({ where: eq(s.rooms.slug, q.room) });
    const cats = room ? await db.select({ id: s.categories.id }).from(s.categories).where(eq(s.categories.roomId, room.id)) : [];
    where.push(inArray(s.products.categoryId, cats.length ? cats.map((c) => c.id) : ["__none__"]));
  }
  const woods = (q.wood || "").split(",").filter(Boolean);
  if (woods.length) where.push(inArray(s.products.woodType, woods));
  if (q.min && !isNaN(+q.min)) where.push(gte(s.products.price, +q.min));
  if (q.max && !isNaN(+q.max)) where.push(lte(s.products.price, +q.max));
  if (q.discount && +q.discount > 0)
    where.push(sql`(${s.products.mrp} - ${s.products.price}) * 100 >= ${+q.discount} * ${s.products.mrp}`);
  if (q.rating && +q.rating > 0) where.push(gte(s.products.ratingAvg, +q.rating));
  if (q.q?.trim()) {
    const term = `%${q.q.trim()}%`;
    where.push(or(ilike(s.products.name, term), ilike(s.products.woodType, term), ilike(s.products.sku, term))!);
  }
  const order =
    q.sort === "price-asc" ? [asc(s.products.price)]
    : q.sort === "price-desc" ? [desc(s.products.price)]
    : q.sort === "new" ? [desc(s.products.createdAt)]
    : q.sort === "discount" ? [desc(sql`(${s.products.mrp} - ${s.products.price})::float / nullif(${s.products.mrp},0)`)]
    : [desc(s.products.featured), asc(s.products.sortOrder), desc(s.products.createdAt)];
  const page = Math.max(1, parseInt(q.page || "1") || 1);
  const w = and(...where);
  const [items, [{ n }]] = await Promise.all([
    db.select(cardCols).from(s.products).where(w).orderBy(...order).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ n: sql<number>`count(*)::int` }).from(s.products).where(w),
  ]);
  return { items, total: n, page, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)) };
}

export const categoryCounts = unstable_cache(_categoryCounts, ["category-counts"], { tags: ["catalog"], revalidate: 300 });
async function _categoryCounts() {
  return db
    .select({
      id: s.categories.id, name: s.categories.name, slug: s.categories.slug,
      n: sql<number>`(select count(*)::int from ${s.products} p where p.category_id = "categories"."id" and p.active)`,
    })
    .from(s.categories).where(eq(s.categories.active, true)).orderBy(asc(s.categories.name));
}

export const woodTypes = unstable_cache(_woodTypes, ["wood-types"], { tags: ["catalog"], revalidate: 300 });
async function _woodTypes() {
  const rows = await db.selectDistinct({ w: s.products.woodType }).from(s.products).where(eq(s.products.active, true));
  return rows.map((r) => r.w).filter(Boolean).sort() as string[];
}

export const navData = unstable_cache(_navData, ["nav-data"], { tags: ["catalog"], revalidate: 300 });
async function _navData() {
  const rooms = await db.query.rooms.findMany({
    orderBy: asc(s.rooms.sortOrder),
    with: { categories: { where: eq(s.categories.active, true), orderBy: asc(s.categories.name), columns: { name: true, slug: true, image: true } } },
  });
  return rooms.map((r) => ({ name: r.name, slug: r.slug, image: r.image, description: r.description, categories: r.categories }));
}
export type NavRoom = Awaited<ReturnType<typeof _navData>>[number];
