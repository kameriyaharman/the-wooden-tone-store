import { Zap } from "lucide-react";
import { StoreProvider } from "@/components/store-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer, MobileBottomNav, Toast, WhatsAppFab } from "@/components/cart-ui";
import { getPublicSettings } from "@/lib/settings";
import { navData } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { CustomCursor, ScrollReveal } from "@/components/motion";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [st, rooms, session] = await Promise.all([getPublicSettings(), navData(), getSession()]);
  const ann = [...st.announcements, ...st.announcements, ...st.announcements, ...st.announcements];
  return (
    <StoreProvider>
      <div className="overflow-hidden bg-walnut text-white">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap py-2 text-[12px]">
          {ann.map((a, i) => (
            <span key={i} className="flex items-center gap-2"><Zap className="h-3 w-3 text-teak" />{a}</span>
          ))}
        </div>
      </div>
      <Header rooms={rooms} storeName={st.storeName} tagline={st.tagline} whatsapp={st.whatsapp} loggedIn={!!session} />
      <main className="min-h-[50vh]">{children}</main>
      <Footer st={st} />
      <CartDrawer freeAbove={Number(st.freeShippingAbove) || 0} loggedIn={!!session} />
      <WhatsAppFab number={st.whatsapp} />
      <MobileBottomNav />
      <Toast />
      <ScrollReveal />
      <CustomCursor />
    </StoreProvider>
  );
}
