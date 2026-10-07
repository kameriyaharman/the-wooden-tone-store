"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema as s } from "./db";
import { requireAdmin } from "./auth";
import { saveSettings, getSettings } from "./settings";
import { confirmOrder, restockOrder } from "./orders";
import { slugify } from "./format";
import { SECRET_KEYS, DEFAULT_SETTINGS } from "./defaults";
import type { Finish, SizeOpt, Spec } from "./db/schema";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const num = (fd: FormData, k: string, d = 0) => {
  const v = str(fd, k).replace(/[,₹\s]/g, "");
  return v === "" || isNaN(+v) ? d : Math.round(+v);
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const json = <T,>(fd: FormData, k: string, d: T): T => {
  try { return JSON.parse(str(fd, k) || "null") ?? d; } catch { return d; }
};
const lines = (fd: FormData, k: string) => str(fd, k).split("\n").map((x) => x.trim()).filter(Boolean);
const refresh = () => revalidatePath("/", "layout");

async function uniqueSlug(table: typeof s.products | typeof s.categories, base: string, exceptId?: string) {
  let slug = slugify(base) || "item";
  for (let i = 2; i < 200; i++) {
    const hit = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
    if (!hit.length || hit[0].id === exceptId) return slug;
    slug = `${slugify(base)}-${i}`;
  }
  return `${slugify(base)}-${Date.now()}`;
}

/* ---------------- Products ---------------- */
export async function saveProduct(fd: FormData) {
  await requireAdmin();
  const id = opt(fd, "id");
  const name = str(fd, "name");
  if (!name) throw new Error("Name is required");
  const price = num(fd, "price");
  const mrp = Math.max(num(fd, "mrp", price), price);
  const data = {
    name,
    slug: await uniqueSlug(s.products, str(fd, "slug") || name.replace(/^The Wooden Tone /, ""), id || undefined),
    sku: opt(fd, "sku"),
    shortDesc: opt(fd, "shortDesc"),
    description: opt(fd, "description"),
    bullets: lines(fd, "bullets"),
    price, mrp,
    stock: num(fd, "stock"),
    woodType: opt(fd, "woodType"),
    categoryId: opt(fd, "categoryId"),
    images: json<string[]>(fd, "images", []),
    finishes: json<Finish[]>(fd, "finishes", []).filter((f) => f.name),
    sizes: json<SizeOpt[]>(fd, "sizes", []).filter((f) => f.name).map((x) => ({ ...x, label: x.label || x.name, priceDelta: Number(x.priceDelta) || 0 })),
    specs: json<Spec[]>(fd, "specs", []).filter((f) => f.label && f.value),
    shipsIn: str(fd, "shipsIn") || "7–10 days",
    careText: opt(fd, "careText"),
    featured: bool(fd, "featured"),
    trending: bool(fd, "trending"),
    active: bool(fd, "active"),
    sortOrder: num(fd, "sortOrder"),
    updatedAt: new Date(),
  };
  if (id) await db.update(s.products).set(data).where(eq(s.products.id, id));
  else await db.insert(s.products).values(data);
  refresh();
  redirect(`/admin/products?saved=1`);
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  await db.delete(s.products).where(eq(s.products.id, str(fd, "id")));
  refresh();
  redirect("/admin/products?deleted=1");
}

export async function duplicateProduct(fd: FormData) {
  await requireAdmin();
  const p = await db.query.products.findFirst({ where: eq(s.products.id, str(fd, "id")) });
  if (!p) return;
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = p;
  const [n] = await db.insert(s.products).values({ ...rest, name: `${p.name} (copy)`, slug: await uniqueSlug(s.products, `${p.slug}-copy`), active: false }).returning();
  redirect(`/admin/products/${n.id}`);
}

export async function quickUpdateProduct(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const patch: Partial<typeof s.products.$inferInsert> = { updatedAt: new Date() };
  if (fd.has("stock")) patch.stock = num(fd, "stock");
  if (fd.has("price")) patch.price = num(fd, "price");
  if (fd.has("toggleActive")) {
    const p = await db.query.products.findFirst({ where: eq(s.products.id, id), columns: { active: true } });
    patch.active = !p?.active;
  }
  await db.update(s.products).set(patch).where(eq(s.products.id, id));
  refresh();
}

/* ---------------- Categories & Rooms ---------------- */
export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const id = opt(fd, "id");
  const name = str(fd, "name");
  if (!name) return;
  const data = {
    name,
    slug: await uniqueSlug(s.categories, str(fd, "slug") || name, id || undefined),
    description: opt(fd, "description"),
    image: opt(fd, "image"),
    roomId: opt(fd, "roomId"),
    sortOrder: num(fd, "sortOrder"),
    featured: bool(fd, "featured"),
    active: bool(fd, "active"),
  };
  if (id) await db.update(s.categories).set(data).where(eq(s.categories.id, id));
  else await db.insert(s.categories).values(data);
  refresh();
  redirect("/admin/categories?saved=1");
}
export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  await db.delete(s.categories).where(eq(s.categories.id, str(fd, "id")));
  refresh();
  redirect("/admin/categories");
}
export async function saveRoom(fd: FormData) {
  await requireAdmin();
  const id = opt(fd, "id");
  const name = str(fd, "name");
  if (!name) return;
  const data = { name, slug: slugify(str(fd, "slug") || name), description: opt(fd, "description"), image: opt(fd, "image"), sortOrder: num(fd, "sortOrder"), showOnHome: bool(fd, "showOnHome") };
  if (id) await db.update(s.rooms).set(data).where(eq(s.rooms.id, id));
  else await db.insert(s.rooms).values(data);
  refresh();
  redirect("/admin/categories?tab=rooms");
}
export async function deleteRoom(fd: FormData) {
  await requireAdmin();
  await db.delete(s.rooms).where(eq(s.rooms.id, str(fd, "id")));
  refresh();
  redirect("/admin/categories?tab=rooms");
}

/* ---------------- Orders ---------------- */
export async function updateOrderStatus(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  const note = opt(fd, "note");
  const o = await db.query.orders.findFirst({ where: eq(s.orders.id, id) });
  if (!o) return;
  if (o.status === "PENDING_PAYMENT" && status !== "CANCELLED" && status !== "PENDING_PAYMENT") {
    // admin manually accepting an unpaid order (e.g. paid by bank transfer)
    await confirmOrder(id, { paid: false, note: "Accepted by admin" });
  }
  if ((status === "CANCELLED" || status === "RETURNED") && o.status !== status) await restockOrder(id);
  if (status !== o.status) {
    await db.update(s.orders).set({ status, updatedAt: new Date() }).where(eq(s.orders.id, id));
    await db.insert(s.orderEvents).values({ orderId: id, status, note });
  } else if (note) {
    await db.insert(s.orderEvents).values({ orderId: id, status, note });
  }
  if (status === "DELIVERED" && o.paymentMethod === "COD" && o.paymentStatus !== "PAID")
    await db.update(s.orders).set({ paymentStatus: "PAID" }).where(eq(s.orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
}
export async function updateOrderShipping(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  await db.update(s.orders).set({ courier: opt(fd, "courier"), trackingNo: opt(fd, "trackingNo"), trackingUrl: opt(fd, "trackingUrl"), adminNote: opt(fd, "adminNote"), updatedAt: new Date() }).where(eq(s.orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
}
export async function updatePaymentStatus(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const ps = str(fd, "paymentStatus");
  if (!["PENDING", "PAID", "FAILED", "REFUNDED"].includes(ps)) return;
  if (ps === "PAID") await confirmOrder(id, { paid: true, note: "Payment marked received by admin" });
  else await db.update(s.orders).set({ paymentStatus: ps, updatedAt: new Date() }).where(eq(s.orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
}
export async function updateOrderAddress(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  await db.update(s.orders).set({
    firstName: str(fd, "firstName"), lastName: opt(fd, "lastName"), phone: str(fd, "phone"), email: str(fd, "email"),
    line1: str(fd, "line1"), city: str(fd, "city"), state: str(fd, "state"), pincode: str(fd, "pincode"), landmark: opt(fd, "landmark"), updatedAt: new Date(),
  }).where(eq(s.orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
}

/* ---------------- Coupons ---------------- */
export async function saveCoupon(fd: FormData) {
  await requireAdmin();
  const id = opt(fd, "id");
  const code = str(fd, "code").toUpperCase().replace(/\s/g, "");
  if (!code) return;
  const exp = str(fd, "expiresAt");
  const data = {
    code, type: str(fd, "type") === "FLAT" ? "FLAT" : "PERCENT", value: num(fd, "value"), minOrder: num(fd, "minOrder"),
    maxDiscount: str(fd, "maxDiscount") ? num(fd, "maxDiscount") : null, usageLimit: str(fd, "usageLimit") ? num(fd, "usageLimit") : null,
    loginOnly: bool(fd, "loginOnly"), active: bool(fd, "active"), expiresAt: exp ? new Date(exp + "T23:59:59+05:30") : null,
  };
  if (id) await db.update(s.coupons).set(data).where(eq(s.coupons.id, id));
  else await db.insert(s.coupons).values(data).onConflictDoUpdate({ target: s.coupons.code, set: data });
  redirect("/admin/coupons?saved=1");
}
export async function deleteCoupon(fd: FormData) {
  await requireAdmin();
  await db.delete(s.coupons).where(eq(s.coupons.id, str(fd, "id")));
  redirect("/admin/coupons");
}

/* ---------------- Banners ---------------- */
export async function saveBanner(fd: FormData) {
  await requireAdmin();
  const id = opt(fd, "id");
  const data = {
    placement: str(fd, "placement") === "PROMO" ? "PROMO" : "HERO", eyebrow: opt(fd, "eyebrow"), title: str(fd, "title"), highlight: opt(fd, "highlight"),
    subtitle: opt(fd, "subtitle"), image: str(fd, "image"), ctaLabel: opt(fd, "ctaLabel"), ctaLink: opt(fd, "ctaLink"),
    cta2Label: opt(fd, "cta2Label"), cta2Link: opt(fd, "cta2Link"), sortOrder: num(fd, "sortOrder"), active: bool(fd, "active"),
  };
  if (!data.title || !data.image) throw new Error("Title and image are required");
  if (id) await db.update(s.banners).set(data).where(eq(s.banners.id, id));
  else await db.insert(s.banners).values(data);
  refresh();
  redirect("/admin/banners?saved=1");
}
export async function deleteBanner(fd: FormData) {
  await requireAdmin();
  await db.delete(s.banners).where(eq(s.banners.id, str(fd, "id")));
  refresh();
  redirect("/admin/banners");
}

/* ---------------- Reviews ---------------- */
async function recalcRating(productId: string | null) {
  if (!productId) return;
  const [r] = await db.select({ avg: sql<number>`coalesce(avg(${s.reviews.rating}),0)::float`, n: sql<number>`count(*)::int` }).from(s.reviews).where(and(eq(s.reviews.productId, productId), eq(s.reviews.approved, true)));
  await db.update(s.products).set({ ratingAvg: Math.round(r.avg * 10) / 10, ratingCount: r.n }).where(eq(s.products.id, productId));
}
export async function updateReview(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const r = await db.query.reviews.findFirst({ where: eq(s.reviews.id, id) });
  if (!r) return;
  const action = str(fd, "action");
  if (action === "delete") await db.delete(s.reviews).where(eq(s.reviews.id, id));
  else if (action === "approve") await db.update(s.reviews).set({ approved: true }).where(eq(s.reviews.id, id));
  else if (action === "hide") await db.update(s.reviews).set({ approved: false, showOnHome: false }).where(eq(s.reviews.id, id));
  else if (action === "home") await db.update(s.reviews).set({ showOnHome: !r.showOnHome, approved: true }).where(eq(s.reviews.id, id));
  await recalcRating(r.productId);
  refresh();
}
export async function addReview(fd: FormData) {
  await requireAdmin();
  const productId = opt(fd, "productId");
  await db.insert(s.reviews).values({ productId, name: str(fd, "name"), city: opt(fd, "city"), rating: Math.min(5, Math.max(1, num(fd, "rating", 5))), text: str(fd, "text"), approved: true, showOnHome: bool(fd, "showOnHome") });
  await recalcRating(productId);
  refresh();
  redirect("/admin/reviews?saved=1");
}

/* ---------------- Enquiries ---------------- */
export async function updateCustomOrder(fd: FormData) {
  await requireAdmin();
  await db.update(s.customOrders).set({ status: str(fd, "status"), adminNote: opt(fd, "adminNote") }).where(eq(s.customOrders.id, str(fd, "id")));
  revalidatePath("/admin/custom-orders");
}
export async function toggleMessageRead(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const m = await db.query.contactMessages.findFirst({ where: eq(s.contactMessages.id, id) });
  if (m) await db.update(s.contactMessages).set({ read: !m.read }).where(eq(s.contactMessages.id, id));
  revalidatePath("/admin/messages");
}
export async function deleteMessage(fd: FormData) {
  await requireAdmin();
  await db.delete(s.contactMessages).where(eq(s.contactMessages.id, str(fd, "id")));
  revalidatePath("/admin/messages");
}
export async function deleteSubscriber(fd: FormData) {
  await requireAdmin();
  await db.delete(s.subscribers).where(eq(s.subscribers.id, str(fd, "id")));
  revalidatePath("/admin/subscribers");
}

/* ---------------- FAQ & Pages ---------------- */
export async function saveFaq(fd: FormData) {
  await requireAdmin();
  const id = opt(fd, "id");
  const data = { question: str(fd, "question"), answer: str(fd, "answer"), sortOrder: num(fd, "sortOrder"), active: bool(fd, "active") };
  if (!data.question) return;
  if (id) await db.update(s.faqs).set(data).where(eq(s.faqs.id, id));
  else await db.insert(s.faqs).values(data);
  refresh();
  redirect("/admin/content?saved=1");
}
export async function deleteFaq(fd: FormData) {
  await requireAdmin();
  await db.delete(s.faqs).where(eq(s.faqs.id, str(fd, "id")));
  refresh();
  redirect("/admin/content");
}
export async function savePage(fd: FormData) {
  await requireAdmin();
  const id = opt(fd, "id");
  const data = { title: str(fd, "title"), slug: slugify(str(fd, "slug") || str(fd, "title")), content: str(fd, "content"), updatedAt: new Date() };
  if (id) await db.update(s.pages).set(data).where(eq(s.pages.id, id));
  else await db.insert(s.pages).values(data);
  refresh();
  redirect("/admin/content?tab=pages&saved=1");
}

/* ---------------- Settings ---------------- */
export async function saveSettingsAction(fd: FormData) {
  await requireAdmin();
  const section = str(fd, "_section");
  const cur = await getSettings();
  const patch: Record<string, unknown> = {};
  for (const [k, raw] of fd.entries()) {
    if (k.startsWith("_") || k.startsWith("$")) continue;
    if (!(k in DEFAULT_SETTINGS)) continue;
    const def = (DEFAULT_SETTINGS as Record<string, unknown>)[k];
    const v = String(raw);
    if ((SECRET_KEYS as readonly string[]).includes(k) && (v === "" || v === "••••••••")) continue; // keep existing secret
    if (typeof def === "number") patch[k] = Number(v.replace(/[,₹\s]/g, "")) || 0;
    else if (Array.isArray(def)) patch[k] = k === "homeSections" ? JSON.parse(v || "[]") : k === "instagramImages" ? JSON.parse(v || "[]") : v.split("\n").map((x) => x.trim()).filter(Boolean);
    else if (typeof def === "object" && def) patch[k] = JSON.parse(v || "{}");
    else patch[k] = v.trim();
  }
  // checkboxes (unchecked boxes are not submitted)
  for (const k of str(fd, "_bools").split(",").filter(Boolean)) patch[k] = fd.get(k) === "on";
  // social links
  if (fd.has("social_instagram")) patch.social = { ...cur.social, facebook: str(fd, "social_facebook"), instagram: str(fd, "social_instagram"), x: str(fd, "social_x"), linkedin: str(fd, "social_linkedin") };
  patch.whatsapp = patch.whatsapp !== undefined ? String(patch.whatsapp).replace(/\D/g, "") : undefined;
  await saveSettings(patch);
  refresh();
  redirect(`/admin/settings?tab=${section}&saved=1`);
}

export async function changePassword(fd: FormData) {
  const sess = await requireAdmin();
  const cur = str(fd, "current"), next = str(fd, "next");
  const u = await db.query.users.findFirst({ where: eq(s.users.id, sess.uid) });
  if (!u || !(await bcrypt.compare(cur, u.passwordHash))) redirect("/admin/settings?tab=account&err=Current+password+is+incorrect");
  if (next.length < 8) redirect("/admin/settings?tab=account&err=New+password+must+be+at+least+8+characters");
  await db.update(s.users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(s.users.id, sess.uid));
  redirect("/admin/settings?tab=account&saved=1");
}

export async function addAdmin(fd: FormData) {
  await requireAdmin();
  const email = str(fd, "email").toLowerCase();
  const pass = str(fd, "password");
  if (!email || pass.length < 8) redirect("/admin/settings?tab=account&err=Enter+email+and+an+8%2B+character+password");
  const ex = await db.query.users.findFirst({ where: eq(s.users.email, email) });
  if (ex) await db.update(s.users).set({ role: "ADMIN", passwordHash: await bcrypt.hash(pass, 10) }).where(eq(s.users.id, ex.id));
  else await db.insert(s.users).values({ name: str(fd, "name") || "Admin", email, role: "ADMIN", passwordHash: await bcrypt.hash(pass, 10) });
  redirect("/admin/settings?tab=account&saved=1");
}

export async function setUserRole(fd: FormData) {
  const sess = await requireAdmin();
  const id = str(fd, "id");
  if (id === sess.uid) return;
  await db.update(s.users).set({ role: str(fd, "role") === "ADMIN" ? "ADMIN" : "CUSTOMER" }).where(eq(s.users.id, id));
  revalidatePath("/admin/customers");
}
