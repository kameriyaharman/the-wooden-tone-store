"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, LayoutGrid, Ticket, Image, Star, Hammer, Inbox, Mail, Users, FileText, Settings, ExternalLink } from "lucide-react";

const items = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingBag, badge: "orders" },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/categories", label: "Categories", Icon: LayoutGrid },
  { href: "/admin/coupons", label: "Coupons", Icon: Ticket },
  { href: "/admin/banners", label: "Banners", Icon: Image },
  { href: "/admin/reviews", label: "Reviews", Icon: Star, badge: "reviews" },
  { href: "/admin/custom-orders", label: "Custom Orders", Icon: Hammer, badge: "custom" },
  { href: "/admin/messages", label: "Messages", Icon: Inbox, badge: "messages" },
  { href: "/admin/subscribers", label: "Subscribers", Icon: Mail },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/content", label: "FAQ & Pages", Icon: FileText },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const p = usePathname();
  const on = (h: string) => (h === "/admin" ? p === "/admin" : p.startsWith(h));
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:p-3">
      {items.map(({ href, label, Icon, badge }) => (
        <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${on(href) ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
          <Icon className="h-4 w-4" /> <span className="flex-1">{label}</span>
          {badge && badges[badge] > 0 && <span className="rounded-full bg-teak px-1.5 py-0.5 text-[10px] font-bold text-white">{badges[badge]}</span>}
        </Link>
      ))}
      <Link href="/" target="_blank" className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/70 hover:text-white lg:mt-4"><ExternalLink className="h-4 w-4" /> View store</Link>
    </nav>
  );
}
