import { pgTable, text, integer, boolean, timestamp, jsonb, real, customType, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });
const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export type Finish = { name: string; color: string };
export type SizeOpt = { name: string; label: string; priceDelta: number };
export type Spec = { label: string; value: string };

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("CUSTOMER"), // CUSTOMER | ADMIN
  createdAt: created(),
});

export const rooms = pgTable("rooms", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  showOnHome: boolean("show_on_home").notNull().default(true),
});

export const categories = pgTable("categories", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  roomId: text("room_id").references(() => rooms.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  homeSection: boolean("home_section").notNull().default(false),
  active: boolean("active").notNull().default(true),
});

export const products = pgTable("products", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku"),
  shortDesc: text("short_desc"),
  description: text("description"),
  bullets: text("bullets").array().notNull().default([]),
  price: integer("price").notNull(),
  mrp: integer("mrp").notNull(),
  stock: integer("stock").notNull().default(10),
  woodType: text("wood_type"),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  images: text("images").array().notNull().default([]),
  video: text("video"),
  finishes: jsonb("finishes").$type<Finish[]>().notNull().default([]),
  sizes: jsonb("sizes").$type<SizeOpt[]>().notNull().default([]),
  specs: jsonb("specs").$type<Spec[]>().notNull().default([]),
  shipsIn: text("ships_in").notNull().default("7–10 days"),
  careText: text("care_text"),
  featured: boolean("featured").notNull().default(false),
  trending: boolean("trending").notNull().default(false),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ratingAvg: real("rating_avg").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("products_cat_idx").on(t.categoryId)]);

export const reviews = pgTable("reviews", {
  id: id(),
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  city: text("city"),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  approved: boolean("approved").notNull().default(false),
  showOnHome: boolean("show_on_home").notNull().default(false),
  createdAt: created(),
});

export const coupons = pgTable("coupons", {
  id: id(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("PERCENT"), // PERCENT | FLAT
  value: integer("value").notNull(),
  minOrder: integer("min_order").notNull().default(0),
  maxDiscount: integer("max_discount"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  loginOnly: boolean("login_only").notNull().default(false),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: created(),
});

export const orders = pgTable("orders", {
  id: id(),
  orderNo: text("order_no").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  line1: text("line1").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  landmark: text("landmark"),
  mrpTotal: integer("mrp_total").notNull(),
  subtotal: integer("subtotal").notNull(),
  couponCode: text("coupon_code"),
  couponDiscount: integer("coupon_discount").notNull().default(0),
  shipping: integer("shipping").notNull().default(0),
  codFee: integer("cod_fee").notNull().default(0),
  total: integer("total").notNull(),
  paymentMethod: text("payment_method").notNull(), // RAZORPAY | PHONEPE | COD
  paymentStatus: text("payment_status").notNull().default("PENDING"), // PENDING | PAID | FAILED | REFUNDED
  status: text("status").notNull().default("PENDING_PAYMENT"),
  stockDeducted: boolean("stock_deducted").notNull().default(false),
  courier: text("courier"),
  trackingNo: text("tracking_no"),
  trackingUrl: text("tracking_url"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  phonepeOrderId: text("phonepe_order_id"),
  customerNote: text("customer_note"),
  adminNote: text("admin_note"),
  createdAt: created(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("orders_phone_idx").on(t.phone), index("orders_email_idx").on(t.email)]);

export const orderItems = pgTable("order_items", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  image: text("image"),
  price: integer("price").notNull(),
  mrp: integer("mrp").notNull(),
  qty: integer("qty").notNull(),
  finish: text("finish"),
  size: text("size"),
});

export const orderEvents = pgTable("order_events", {
  id: id(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: created(),
});

export const customOrders = pgTable("custom_orders", {
  id: id(),
  itemType: text("item_type").notNull(),
  wood: text("wood"),
  width: text("width"),
  depth: text("depth"),
  height: text("height"),
  budget: text("budget"),
  images: text("images").array().notNull().default([]),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("NEW"),
  adminNote: text("admin_note"),
  createdAt: created(),
});

export const contactMessages = pgTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: created(),
});

export const subscribers = pgTable("subscribers", {
  id: id(),
  email: text("email").notNull().unique(),
  createdAt: created(),
});

export const faqs = pgTable("faqs", {
  id: id(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const banners = pgTable("banners", {
  id: id(),
  placement: text("placement").notNull().default("HERO"), // HERO | PROMO
  eyebrow: text("eyebrow"),
  title: text("title").notNull(),
  highlight: text("highlight"),
  subtitle: text("subtitle"),
  image: text("image").notNull(),
  ctaLabel: text("cta_label"),
  ctaLink: text("cta_link"),
  cta2Label: text("cta2_label"),
  cta2Link: text("cta2_link"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const pages = pgTable("pages", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
});

export const media = pgTable("media", {
  id: id(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: created(),
});

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  room: one(rooms, { fields: [categories.roomId], references: [rooms.id] }),
  products: many(products),
}));
export const roomsRelations = relations(rooms, ({ many }) => ({ categories: many(categories) }));
export const ordersRelations = relations(orders, ({ many }) => ({ items: many(orderItems), events: many(orderEvents) }));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({ order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }) }));
export const orderEventsRelations = relations(orderEvents, ({ one }) => ({ order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }) }));
export const reviewsRelations = relations(reviews, ({ one }) => ({ product: one(products, { fields: [reviews.productId], references: [products.id] }) }));

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
