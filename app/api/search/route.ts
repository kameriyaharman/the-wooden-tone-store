import { NextResponse } from "next/server";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (q.length < 2) return NextResponse.json({ items: [] });
  const term = `%${q}%`;
  const rows = await db
    .select({ name: s.products.name, slug: s.products.slug, price: s.products.price, images: s.products.images })
    .from(s.products)
    .where(and(eq(s.products.active, true), or(ilike(s.products.name, term), ilike(s.products.woodType, term))))
    .limit(6);
  return NextResponse.json({ items: rows.map((r) => ({ name: r.name, slug: r.slug, price: r.price, image: r.images[0] || null })) });
}
