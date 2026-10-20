import { StoreProvider } from "@/components/store-provider";
import { AnnouncementBar, Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDrawer, MobileBottomNav, Toast, WhatsAppFab } from "@/components/cart-ui";
import { getPublicSettings } from "@/lib/settings";
import { navData } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { CustomCursor, ScrollReveal } from "@/components/motion";
import { BackToTop } from "@/components/back-to-top";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [st, rooms, session] = await Promise.all([getPublicSettings(), navData(), getSession()]);
  return (
    <StoreProvider>
      <AnnouncementBar items={st.announcements} />
      <Header rooms={rooms} storeName={st.storeName} tagline={st.tagline} whatsapp={st.whatsapp} loggedIn={!!session} />
      <main className="min-h-[50vh]">{children}</main>
      <Footer st={st} />
      <CartDrawer freeAbove={Number(st.freeShippingAbove) || 0} loggedIn={!!session} />
      <WhatsAppFab number={st.whatsapp} />
      <MobileBottomNav />
      <Toast />
      <BackToTop />
      <ScrollReveal />
      <CustomCursor />
    </StoreProvider>
  );
}
