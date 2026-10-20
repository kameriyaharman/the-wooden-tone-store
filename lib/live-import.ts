/**
 * Import of the catalogue from the old live site (thewoodentone.com).
 * Images are downloaded from the old site, converted to WebP and stored in our
 * own media table, so nothing depends on the old site afterwards.
 * Products that already exist (by slug) are skipped, so it is safe to re-run.
 */
import sharp from "sharp";
import { and, eq, like, sql } from "drizzle-orm";
import { db, schema as s } from "./db";

const OLD_SITE = "https://thewoodentone.com/";
export const LIVE_FLAG = "liveImportV1";
export const LIVE_DATA_KEY = "liveImportData";

export type LiveProduct = {
  slug: string; name: string; cat: string; sku: string; price: number; mrp: number;
  imgs: string[]; short: string; blocks: [string, string, string][]; extra: [string, string][]; stock: string;
};

const catSlug = (x: string) => x.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Rough room guess for categories that don't exist yet (admin can change it later).
const ROOM_HINTS: [RegExp, string][] = [
  [/bed|wardrobe|dressing|cloth|hanger|bedside|night/i, "bedroom"],
  [/dining|bar|stool|cutlery|napkin|kitchen|spice|jar|bowl|tray|coaster|mug|cake|egg|mortar|chopping|serving/i, "kitchen"],
  [/sofa|chair|arm|rocking|center|coffee|console|end table|ottoman|bench|tv|pouf|stool/i, "living-room"],
  [/book|shelf|shelves|desk|chest|drawer|cabinet|storage|rack|lapdesk/i, "storage"],
  [/mirror/i, "mirrors"],
  [/pooja|incense|lamp|light|candle|decor|planter|key|clock|frame|vase|toothbrush|towel|wall/i, "decor-pooja"],
  [/kid|money box|toy/i, "kids"],
];

async function downloadImage(path: string): Promise<string | null> {
  const url = OLD_SITE + path.replace(/^\/+/, "");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (TheWoodenTone importer)" }, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const raw = Buffer.from(await r.arrayBuffer());
      const buf = await sharp(raw).rotate().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      const [row] = await db.insert(s.media).values({ filename: path.split("/").pop()!.slice(0, 200), mime: "image/webp", size: buf.length, data: buf }).returning({ id: s.media.id });
      return `/media/${row.id}`;
    } catch (e) {
      if (attempt === 2) { console.warn(`  image failed ${url}: ${(e as Error).message}`); return null; }
      await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
    }
  }
  return null;
}

function textParts(p: LiveProduct) {
  const isBenefit = (sec: string) => /benefit|feature|highlight/i.test(sec);
  const paras = p.blocks.filter(([sec, tag]) => tag === "P" && !isBenefit(sec)).map((b) => b[2]);
  const bullets = p.blocks.filter(([sec, tag]) => tag === "LI").map((b) => b[2]).slice(0, 12);
  const description = [...new Set(paras)].join("\n\n") || p.short || null;
  const specs = p.extra.filter(([k, v]) => k && v && k.length < 40).map(([label, value]) => ({ label, value: value.slice(0, 200) }));
  return { description, bullets, specs };
}

async function ensureCategory(name: string, cache: Map<string, string>, rooms: Map<string, string>, image: string | null) {
  const clean = (name || "").trim() || "Other";
  const slug = catSlug(clean);
  if (cache.has(slug)) return cache.get(slug)!;
  const found = await db.query.categories.findFirst({ where: eq(s.categories.slug, slug) });
  if (found) {
    if (!found.active) await db.update(s.categories).set({ active: true }).where(eq(s.categories.id, found.id));
    if (!found.image && image) await db.update(s.categories).set({ image }).where(eq(s.categories.id, found.id));
    cache.set(slug, found.id);
    return found.id;
  }
  const roomSlug = ROOM_HINTS.find(([re]) => re.test(clean))?.[1];
  const [row] = await db.insert(s.categories).values({ name: clean, slug, image, roomId: roomSlug ? rooms.get(roomSlug) ?? null : null, sortOrder: 100 }).returning({ id: s.categories.id });
  cache.set(slug, row.id);
  console.log(`  + category ${clean}`);
  return row.id;
}


type Status = { running: boolean; total: number; added: number; skipped: number; failed: number; startedAt?: string; finishedAt?: string; log: string[] };
const g = globalThis as unknown as { __liveImport?: Status };
export function liveImportStatus(): Status {
  return g.__liveImport ?? { running: false, total: 0, added: 0, skipped: 0, failed: 0, log: [] };
}
const log = (st: Status, m: string) => { console.log(m); st.log.push(`${new Date().toISOString().slice(11, 19)} ${m}`); if (st.log.length > 60) st.log.shift(); };

export async function loadLiveData(): Promise<LiveProduct[] | null> {
  const row = await db.query.settings.findFirst({ where: eq(s.settings.key, LIVE_DATA_KEY) });
  return Array.isArray(row?.value) ? (row!.value as LiveProduct[]) : null;
}

export async function runLiveImport(data: LiveProduct[], { force = false } = {}) {
  if (g.__liveImport?.running) return g.__liveImport;
  const st: Status = { running: true, total: data.length, added: 0, skipped: 0, failed: 0, startedAt: new Date().toISOString(), log: [] };
  g.__liveImport = st;
  try {
    const flag = await db.query.settings.findFirst({ where: eq(s.settings.key, LIVE_FLAG) });
    if (flag && !force) { log(st, "Live catalogue already imported — skipping"); return st; }
    const rooms = new Map((await db.select({ id: s.rooms.id, slug: s.rooms.slug }).from(s.rooms)).map((r) => [r.slug, r.id]));
    const catCache = new Map<string, string>();
    // products that already have photos are skipped; ones whose photos failed earlier are retried
    await db.delete(s.products).where(and(sql`cardinality(${s.products.images}) = 0`, eq(s.products.active, false), sql`${s.products.slug} in (${sql.join(data.map((p) => sql`${p.slug}`), sql`, `)})`));
    const existing = new Set((await db.select({ slug: s.products.slug }).from(s.products)).map((r) => r.slug));
    log(st, `Importing ${data.length} products from the old site (${existing.size} products already in store)…`);

    let added = 0, skipped = 0, failed = 0;
    const sync = () => { st.added = added; st.skipped = skipped; st.failed = failed; };
    const todo = data.map((p, i) => ({ p, i })).filter(({ p }) => p.slug && p.name && p.price > 0);
    const CONCURRENCY = 3;
    let next = 0;
    async function worker() {
      while (next < todo.length) {
        const { p, i } = todo[next++];
        if (existing.has(p.slug)) { skipped++; sync(); continue; }
        try {
          const images: string[] = [];
          for (const path of p.imgs.slice(0, 8)) {
            const m = await downloadImage(path);
            if (m) images.push(m);
          }
          const categoryId = await ensureCategory(p.cat, catCache, rooms, images[0] ?? null);
          const { description, bullets, specs } = textParts(p);
          const mrp = Math.max(p.mrp || p.price, p.price);
          await db.insert(s.products).values({
            name: p.name.slice(0, 300), slug: p.slug, sku: p.sku || null,
            shortDesc: p.short ? p.short.slice(0, 400) : null, description, bullets, specs,
            price: p.price, mrp, stock: /out/i.test(p.stock) ? 0 : 10,
            categoryId, images, sortOrder: i, active: images.length > 0,
          }).onConflictDoNothing();
          existing.add(p.slug);
          added++; sync();
          if (added % 10 === 0) log(st, `… ${added} added`);
        } catch (e) {
          failed++; sync();
          log(st, `product failed ${p.slug}: ${(e as Error).message}`);
        }
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    log(st, `Live import: ${added} added, ${skipped} already there, ${failed} failed`);
    if (failed > 0) return st; // try again on next run
    const withImages = await db.$count(s.products, and(sql`${s.products.slug} in (${sql.join(data.map((p) => sql`${p.slug}`), sql`, `)})`, eq(s.products.active, true)));
    if (withImages < data.length * 0.5) { log(st, `Only ${withImages} imported products have photos — not finishing; check image downloads and re-run with force`); return st; }

    // Hide the demo products the store shipped with (they use bundled /seed images).
    const liveSlugs = new Set(data.map((p) => p.slug));
    const demos = await db.select({ id: s.products.id, slug: s.products.slug }).from(s.products).where(sql`exists (select 1 from unnest(${s.products.images}) img where img like '/seed/%')`);
    for (const d of demos) if (!liveSlugs.has(d.slug)) await db.update(s.products).set({ active: false, featured: false, trending: false }).where(eq(s.products.id, d.id));
    if (demos.length) log(st, `hid ${demos.length} demo products`);

    // Give the homepage something to show if nothing live is flagged yet.
    const flagged = await db.$count(s.products, and(eq(s.products.active, true), eq(s.products.trending, true)));
    if (!flagged) {
      const picks = await db.select({ id: s.products.id }).from(s.products)
        .where(and(eq(s.products.active, true), sql`cardinality(${s.products.images}) >= 2`, sql`${s.products.mrp} > ${s.products.price}`))
        .orderBy(sql`${s.products.price} desc`).limit(14);
      for (const [k, r] of picks.entries()) await db.update(s.products).set(k < 10 ? { trending: true } : { featured: true }).where(eq(s.products.id, r.id));
    }
    // Point banner links at a demo product to its category instead.
    await db.update(s.banners).set({ cta2Link: "/shop?category=beds" }).where(like(s.banners.cta2Link, "/product/tashi-%"));

    await db.insert(s.settings).values({ key: LIVE_FLAG, value: new Date().toISOString() }).onConflictDoUpdate({ target: s.settings.key, set: { value: new Date().toISOString() } });
    log(st, "Live catalogue import complete");

  } catch (e) {
    log(st, `Live import error: ${(e as Error).message}`);
  } finally {
    st.running = false;
    st.finishedAt = new Date().toISOString();
  }
  return st;
}
