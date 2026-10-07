import { CartPage } from "@/components/cart-page";
import { getSettings } from "@/lib/settings";
export const metadata = { title: "Your Cart" };
export default async function Page() {
  const st = await getSettings();
  return <CartPage freeAbove={Number(st.freeShippingAbove) || 0} />;
}
