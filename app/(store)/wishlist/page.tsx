import { PageHero } from "@/components/ui";
import { WishlistPage } from "@/components/wishlist-page";
export const metadata = { title: "Wishlist" };
export default function Page() {
  return (
    <>
      <PageHero eyebrow="Saved for later" title="My Wishlist" crumbs={[{ href: "/", label: "Home" }, { label: "Wishlist" }]} />
      <div className="container-site py-10"><WishlistPage /></div>
    </>
  );
}
