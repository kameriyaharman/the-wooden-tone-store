import { and, eq, inArray } from "drizzle-orm";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/lib/auth-actions";
import { db, schema as s } from "@/lib/db";
import { AdminNav } from "@/components/admin/nav";

export const metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const [orders, reviews, custom, messages] = await Promise.all([
    db.$count(s.orders, inArray(s.orders.status, ["PLACED"])),
    db.$count(s.reviews, eq(s.reviews.approved, false)),
    db.$count(s.customOrders, eq(s.customOrders.status, "NEW")),
    db.$count(s.contactMessages, and(eq(s.contactMessages.read, false))),
  ]);
  return (
    <div className="min-h-screen bg-[#F7F4EF] lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="sticky top-0 z-30 bg-walnut text-white lg:h-screen lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/seed/logo.jpg" alt="" className="h-9 rounded bg-white p-0.5" />
            <div className="leading-tight"><p className="font-serif text-lg font-semibold">Wooden Tone</p><p className="text-[10px] uppercase tracking-widest text-white/60">Admin</p></div>
          </div>
          <form action={logoutAction} className="lg:hidden"><button aria-label="Logout"><LogOut className="h-4 w-4" /></button></form>
        </div>
        <AdminNav badges={{ orders, reviews, custom, messages }} />
        <div className="hidden border-t border-white/10 p-4 text-xs text-white/60 lg:block">
          <p className="truncate">{session.email}</p>
          <form action={logoutAction}><button className="mt-2 flex items-center gap-2 text-white/80 hover:text-white"><LogOut className="h-3.5 w-3.5" /> Logout</button></form>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
