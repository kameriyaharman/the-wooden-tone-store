import { db, schema as s } from "../lib/db";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../lib/defaults";

const slugify = (x: string) => x.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const catSlug = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const ROOMS = [
  { name: "Living Room", slug: "living-room", description: "Sofas, armchairs, center tables", image: "/seed/banners/room-living.jpg" },
  { name: "Bedroom", slug: "bedroom", description: "Beds, wardrobes, dressing tables", image: "/seed/banners/room-bedroom.jpg" },
  { name: "Dining", slug: "dining", description: "Dining tables, chairs & sets", image: "/seed/banners/room-dining.jpg" },
  { name: "Storage", slug: "storage", description: "Bookcases, shelves & chests" },
  { name: "Mirrors", slug: "mirrors", description: "Floor and wall mirrors" },
  { name: "Kitchen & Dining", slug: "kitchen", description: "Racks, boxes, holders" },
  { name: "Decor & Pooja", slug: "decor-pooja", description: "Lamps, incense & pooja" },
  { name: "Kids", slug: "kids", description: "Furniture for little ones" },
];

const CATS: [string, string][] = [
  ["Armchairs", "living-room"], ["Bar Cabinets", "dining"], ["Bar Stool", "dining"], ["Bedroom Wardrobes", "bedroom"],
  ["Beds", "bedroom"], ["Beer Mugs", "kitchen"], ["Bookcase", "storage"], ["Cake Stand", "kitchen"],
  ["Center Table", "living-room"], ["Cheval Mirrors", "mirrors"], ["Clothes Rails", "bedroom"], ["Coasters", "kitchen"],
  ["Console & Sofa Tables", "living-room"], ["Coffee Table", "living-room"], ["Cutlery Holder", "kitchen"], ["Desk", "storage"],
  ["Dining Chairs", "dining"], ["Dining Table", "dining"], ["Dining Table & Chair Sets", "dining"], ["Dressers & Chests", "storage"],
  ["Dressing Tables", "bedroom"], ["Egg Baskets", "kitchen"], ["End Table", "living-room"], ["Floor Lamp", "decor-pooja"],
  ["Fruit Bowls", "kitchen"], ["Hangers & Clothing", "bedroom"], ["Incense Holders", "decor-pooja"], ["Jars & Containers", "kitchen"],
  ["Key Holders", "decor-pooja"], ["Lapdesks", "storage"], ["Money Boxes", "kids"], ["Mortar & Pestle", "kitchen"],
  ["Napkin Holder", "kitchen"], ["Ottomans", "living-room"], ["Planter Stands", "decor-pooja"], ["Pooja Supplies", "decor-pooja"],
  ["Rocking Chairs", "living-room"], ["Bedside Table", "bedroom"], ["Sofa", "living-room"], ["Spice Racks", "kitchen"],
  ["Kids Furniture", "kids"], ["Toothbrush Holder", "decor-pooja"], ["Towel Holder", "decor-pooja"], ["TV Units", "living-room"],
  ["Wall Lamps & Sconces", "decor-pooja"], ["Wall Mirrors", "mirrors"], ["Wall Shelves", "storage"], ["Benches", "living-room"],
];
const FEATURED_CATS = ["beds", "sofa", "dining-table", "rocking-chairs", "bedroom-wardrobes", "center-table", "wall-mirrors", "bookcase"];
const HOME_SECTION_CATS = ["beds", "armchairs", "console-sofa-tables", "bookcase", "spice-racks"];

const FINISHES = [
  { name: "Natural Honey", color: "#B9803F" },
  { name: "Walnut", color: "#6B3A1F" },
  { name: "Dark Teak", color: "#3A2411" },
  { name: "Light Oak", color: "#D8B98A" },
];
const BED_SIZES = [
  { name: "Single", label: "Single (36 × 78 in)", priceDelta: -15000 },
  { name: "Queen", label: "Queen (60 × 78 in)", priceDelta: 0 },
  { name: "King", label: "King (72 × 78 in)", priceDelta: 10000 },
];

type F = { featured?: boolean; trending?: boolean; bed?: boolean };
const P: [string, string, number, number, string[], string, F][] = [
  ["The Wooden Tone Tashi Poster Bed for Bedroom Use", "beds", 85000, 100000, ["tashi-main", "beds-2", "beds-1", "beds-3"], "Sheesham", { featured: true, trending: true, bed: true }],
  ["The Wooden Tone Tashi Poster Bed, Cane Headboard", "beds", 84999, 100000, ["beds-2"], "Sheesham", { bed: true }],
  ["The Wooden Tone Mango Wood Bed for Bedroom", "beds", 45000, 70000, ["beds-3"], "Mango Wood", { bed: true }],
  ["The Wooden Tone Beds for Living Room Use", "beds", 60000, 70000, ["beds-4"], "Sheesham", { bed: true }],
  ["The Wooden Tone Solid Wood Wardrobe for Storage", "bedroom-wardrobes", 39999, 100000, ["beds-5"], "Sheesham", {}],
  ["The Wooden Tone One Seater Sofa Chair for Living Room", "armchairs", 15999, 31998, ["arm-1"], "Teak", { trending: true }],
  ["The Wooden Tone Rocking Chair for Living Room Relaxing", "rocking-chairs", 10999, 21998, ["arm-2"], "Sheesham", {}],
  ["The Wooden Tone Chair with Cushion for Living Room", "rocking-chairs", 6999, 13999, ["arm-3"], "Sheesham", {}],
  ["The Wooden Tone Rocking Chair for Relaxing Seating", "rocking-chairs", 9999, 19998, ["arm-4"], "Acacia", {}],
  ["The Wooden Tone Wood Bar Chair with Cushion", "bar-stool", 7000, 14000, ["arm-5"], "Sheesham", {}],
  ["The Wooden Tone Marble Center Table, Walnut Finish", "center-table", 35000, 70000, ["tables-1"], "Sheesham", { featured: true, trending: true }],
  ["The Wooden Tone Console Table for Entryway & Living", "console-sofa-tables", 7999, 15999, ["tables-2"], "Mango Wood", {}],
  ["Wooden Console Table for Living Room, Durable Wood", "console-sofa-tables", 19999, 39998, ["tables-3"], "Sheesham", { featured: true }],
  ["Wooden Natural Mango Wood Console Table", "console-sofa-tables", 4999, 9998, ["tables-4"], "Mango Wood", {}],
  ["The Wooden Tone Natural Wooden Console Table", "console-sofa-tables", 8999, 18000, ["tables-5"], "Acacia", {}],
  ["Wooden Corner Shelf Bookcase Storage Display", "bookcase", 8999, 17998, ["storage-1"], "Sheesham", {}],
  ["Wooden Solid Wood Corner Shelf 5 Tier Tall Bookcase", "bookcase", 5999, 11998, ["storage-2"], "Sheesham", {}],
  ["Wooden Wall Shelf Storage Unit with Drawers", "wall-shelves", 11999, 22998, ["storage-3"], "Mango Wood", {}],
  ["Wooden Book Cases Free Standing for Home Office", "bookcase", 9999, 19998, ["storage-4"], "Sheesham", {}],
  ["The Wooden Tone Mini Wardrobe Cum Cupboard", "dressers-chests", 21999, 30000, ["storage-5"], "Mango Wood", {}],
  ["Wooden Wall Mounted Kitchen Rack, 3 Shelves", "spice-racks", 1499, 3198, ["kitchen-1"], "Sheesham", {}],
  ["Mango Wood Spice Rack Organizer, 3 Tier", "spice-racks", 799, 1598, ["kitchen-2"], "Mango Wood", {}],
  ["The Wooden Tone Brown Wooden Spice Box with 4 Containers", "spice-racks", 820, 1291, ["kitchen-3"], "Sheesham", {}],
  ["Wooden Beer Mug, Handcrafted Rustic Wood", "beer-mugs", 599, 1198, ["kitchen-4"], "Mango Wood", {}],
  ["The Wooden Tone Incense Holder for Pooja Use", "incense-holders", 199, 398, ["kitchen-5"], "Sheesham", {}],
  ["The Wooden Tone Teak Secretary Desk for Writing", "desk", 19999, 29998, ["desk"], "Teak", { trending: true }],
  ["The Wooden Tone Wood Sofa Bench with Cushioned Seat", "benches", 19999, 46000, ["bench"], "Sheesham", { featured: true }],
  ["The Wooden Tone Gold Vintage Floor Mirror", "cheval-mirrors", 9999, 28000, ["mirror"], "Mango Wood", { trending: true }],
  ["The Wooden Tone Solid Wood Wardrobe with Cane Doors", "bedroom-wardrobes", 34999, 50000, ["wardrobe-cane"], "Sheesham", {}],
];

const FAQS = [
  ["How long does delivery take?", "Ready-stock items ship in 3–7 days. Made-to-order furniture is delivered in the time shown on the product page. Shipping is free across India."],
  ["What is your return policy?", "If your furniture arrives damaged or differs from what you ordered, tell us within 7 days of delivery with photos and we will repair, replace or refund it."],
  ["Do you offer Cash on Delivery?", "Yes. Cash on Delivery is available across most PIN codes in India. You can also pay by UPI, cards, net banking or wallets."],
  ["How do I track my order?", "Use the Track Order page with your Order ID and phone number. You'll also see every status update there as your order moves."],
  ["Which wood do you use?", "We work mainly with seasoned sheesham, teak, mango wood and acacia — no particle board."],
];

const PAGES = [
  ["privacy-policy", "Privacy Policy", "We collect only the details needed to process your order — name, phone, email and delivery address — and never sell them.\n\nPayments are processed by secure payment partners; we do not store card details.\n\nContact us any time to update or delete your information."],
  ["terms-of-service", "Terms of Service", "By placing an order on The Wooden Tone you agree to these terms.\n\nPrices are inclusive of taxes. Natural wood varies in grain and shade, so slight differences from photos are normal.\n\nWe may cancel an order if a product is unavailable, in which case any payment is refunded in full."],
  ["refund-and-cancellation", "Refund & Cancellation", "Orders can be cancelled before dispatch for a full refund.\n\nDamaged or incorrect items reported within 7 days of delivery are repaired, replaced or refunded.\n\nRefunds go back to the original payment method within 5–7 business days."],
  ["shipping-and-returns", "Shipping & Returns", "Shipping is free across India. Ready-stock items ship in 3–7 days; made-to-order pieces ship in the time shown on the product page.\n\nLarge furniture is delivered and assembled by our team."],
  ["cookie-policy", "Cookie Policy", "We use essential cookies to keep you signed in. Your cart and wishlist are stored in your own browser. We do not use advertising cookies."],
];

export async function seedCatalog() {
  const roomIds: Record<string, string> = {};
  for (const [i, r] of ROOMS.entries()) {
    const [row] = await db.insert(s.rooms).values({ ...r, sortOrder: i, showOnHome: i < 3 }).onConflictDoNothing().returning();
    roomIds[r.slug] = row ? row.id : (await db.query.rooms.findFirst({ where: eq(s.rooms.slug, r.slug) }))!.id;
  }
  const catIds: Record<string, string> = {};
  for (const [i, [name, room]] of CATS.entries()) {
    const slug = catSlug(name);
    const [row] = await db.insert(s.categories).values({
      name, slug, roomId: roomIds[room], image: `/seed/categories/${slug}.jpg`, sortOrder: i,
      featured: FEATURED_CATS.includes(slug), homeSection: HOME_SECTION_CATS.includes(slug),
    }).onConflictDoNothing().returning();
    catIds[slug] = row ? row.id : (await db.query.categories.findFirst({ where: eq(s.categories.slug, slug) }))!.id;
  }
  for (const [i, [name, cat, price, mrp, imgs, wood, f]] of P.entries()) {
    const slug = slugify(name.replace(/^The Wooden Tone /, ""));
    const isBed = !!f.bed;
    await db.insert(s.products).values({
      name, slug, sku: `TWT-${1001 + i}`, price, mrp, stock: 10 + (i % 7), woodType: wood,
      categoryId: catIds[cat], images: imgs.map((x) => `/seed/products/${x}.jpg`),
      featured: !!f.featured, trending: !!f.trending, sortOrder: i,
      shortDesc: `Solid ${wood.toLowerCase()} wood, handcrafted and hand-finished.`,
      description: isBed
        ? "The Tashi Poster Bed brings a classic four-poster silhouette into the modern bedroom. Turned posts, a slatted headboard and a hand-rubbed natural finish make it the warm centrepiece of the room.\n\nBuilt from seasoned solid wood with strong mortise-and-tenon joinery, it's made to stay sturdy and squeak-free for years."
        : `Crafted from seasoned solid ${wood.toLowerCase()} by skilled artisans, this piece pairs everyday practicality with the warmth of natural wood grain. Finished by hand and built to last for generations.`,
      bullets: isBed
        ? ["Solid wood frame with natural grain finish", "Four turned poster columns", "Solid wooden slats — no box spring needed", "Assembly by our team at delivery"]
        : ["100% solid wood — no particle board", "Hand-sanded and polished finish", "Sturdy joinery for daily use", "Free delivery across India"],
      finishes: FINISHES,
      sizes: isBed ? BED_SIZES : [],
      specs: [
        { label: "Material", value: `Solid ${wood} Wood` },
        { label: "Finish", value: "Natural Honey" },
        ...(isBed ? [{ label: "Size", value: "Queen · 60 × 78 in mattress" }, { label: "Dimensions", value: "W 66 × L 84 × H 78 in" }, { label: "Storage", value: "No" }] : []),
        { label: "Assembly", value: isBed ? "Included" : "Not required" },
        { label: "Warranty", value: "1 year manufacturing" },
      ],
      careText: "Dust with a soft dry cloth. Wipe spills immediately. Keep away from direct sunlight and heat sources. Polish every 6–12 months to keep the finish rich.",
    }).onConflictDoNothing();
  }
  const faqCount = await db.select({ n: sql<number>`count(*)::int` }).from(s.faqs);
  if (faqCount[0].n === 0) await db.insert(s.faqs).values(FAQS.map(([question, answer], i) => ({ question, answer, sortOrder: i })));
  for (const [slug, title, content] of PAGES) await db.insert(s.pages).values({ slug, title, content }).onConflictDoNothing();
  const bannerCount = await db.select({ n: sql<number>`count(*)::int` }).from(s.banners);
  if (bannerCount[0].n === 0) {
    await db.insert(s.banners).values([
      { placement: "HERO", eyebrow: "Handcrafted · Solid Wood · Made in India", title: "Designed in wood,", highlight: "built for living.", subtitle: "Beds, sofas, dining sets and décor crafted from sheesham, teak and mango wood — delivered free across India.", image: "/seed/banners/hero-sofa.jpg", ctaLabel: "Shop Now", ctaLink: "/shop", cta2Label: "Explore Categories", cta2Link: "/categories", sortOrder: 0 },
      { placement: "HERO", eyebrow: "Bestseller · 15% Off", title: "The Tashi", highlight: "Poster Bed.", subtitle: "Turned posts, cane panels and a hand-rubbed finish in solid sheesham.", image: "/seed/products/tashi-main.jpg", ctaLabel: "Shop Beds", ctaLink: "/shop?category=beds", cta2Label: "View Product", cta2Link: "/product/tashi-poster-bed-for-bedroom-use", sortOrder: 1 },
      { placement: "PROMO", eyebrow: "Bedroom", title: "A Bedroom Made for Beautiful Living", subtitle: "Warm wood, soft comfort, timeless style.", image: "/seed/products/beds-3.jpg", ctaLabel: "Discover", ctaLink: "/shop?room=bedroom", sortOrder: 0 },
      { placement: "PROMO", eyebrow: "Dining", title: "Gather Around Solid Wood", subtitle: "Dining tables & chair sets for everyday meals.", image: "/seed/banners/room-dining.jpg", ctaLabel: "Shop Dining", ctaLink: "/shop?room=dining", sortOrder: 1 },
    ]);
  }
}

export async function seedEssentials() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.insert(s.settings).values({ key, value }).onConflictDoNothing();
  }
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@thewoodentone.com").toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || "ChangeMe@123";
  const existing = await db.query.users.findFirst({ where: eq(s.users.email, adminEmail) });
  if (!existing) {
    await db.insert(s.users).values({ name: "Admin", email: adminEmail, passwordHash: await bcrypt.hash(adminPass, 10), role: "ADMIN" });
    console.log(`Admin created: ${adminEmail}`);
  }
}

async function main() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.settings);
  if (n === 0 || process.argv.includes("--force")) {
    await seedCatalog();
    console.log("Catalog seeded");
  }
  await seedEssentials();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
