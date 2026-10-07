import { desc, eq } from "drizzle-orm";
import { CheckoutPage } from "@/components/checkout-page";
import { getSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { razorpayCreds } from "@/lib/payments/razorpay";
import { phonepeCreds } from "@/lib/payments/phonepe";
import { db, schema as s } from "@/lib/db";

export const metadata = { title: "Checkout" };

export default async function Page() {
  const [st, session, rz, pp] = await Promise.all([getSettings(), getSession(), razorpayCreds(), phonepeCreds()]);
  let savedAddr = null;
  if (session) {
    const last = await db.query.orders.findFirst({ where: eq(s.orders.userId, session.uid), orderBy: desc(s.orders.createdAt) });
    if (last) savedAddr = { firstName: last.firstName, lastName: last.lastName || "", email: last.email, phone: last.phone, line1: last.line1, city: last.city, state: last.state, pincode: last.pincode, landmark: last.landmark || "" };
  }
  return (
    <CheckoutPage
      methods={{ razorpay: rz.enabled, phonepe: pp.enabled, cod: !!st.codEnabled, codFee: Number(st.codFee) || 0, codMax: Number(st.codMaxOrder) || 0 }}
      loggedIn={!!session}
      user={session ? { name: session.name, email: session.email } : null}
      savedAddr={savedAddr}
    />
  );
}
