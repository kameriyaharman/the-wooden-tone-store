import { desc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { getSession } from "@/lib/auth";

const csv = (rows: (string | number | null | undefined)[][]) =>
  rows.map((r) => r.map((v) => { const t = String(v ?? ""); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; }).join(",")).join("\n");

export async function GET(req: Request) {
  const sess = await getSession();
  if (!sess || sess.role !== "ADMIN") return new Response("Unauthorized", { status: 401 });
  const type = new URL(req.url).searchParams.get("type");
  let body = "";
  if (type === "subscribers") {
    const rows = await db.select().from(s.subscribers).orderBy(desc(s.subscribers.createdAt));
    body = csv([["Email", "Subscribed"], ...rows.map((r) => [r.email, r.createdAt.toISOString()])]);
  } else if (type === "customers") {
    const rows = await db.select().from(s.users).orderBy(desc(s.users.createdAt));
    body = csv([["Name", "Email", "Phone", "Role", "Joined"], ...rows.map((r) => [r.name, r.email, r.phone, r.role, r.createdAt.toISOString()])]);
  } else {
    const rows = await db.query.orders.findMany({ orderBy: desc(s.orders.createdAt), with: { items: true } });
    body = csv([
      ["Order No", "Date", "Status", "Payment Method", "Payment Status", "Name", "Phone", "Email", "Address", "City", "State", "PIN", "Items", "Subtotal", "Coupon", "Discount", "Shipping", "Total"],
      ...rows.map((o) => [o.orderNo, o.createdAt.toISOString(), o.status, o.paymentMethod, o.paymentStatus, `${o.firstName} ${o.lastName || ""}`.trim(), o.phone, o.email, o.line1, o.city, o.state, o.pincode,
        o.items.map((i) => `${i.name} x${i.qty}`).join("; "), o.subtotal, o.couponCode, o.couponDiscount, o.shipping, o.total]),
    ]);
  }
  return new Response("﻿" + body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${type || "orders"}-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
