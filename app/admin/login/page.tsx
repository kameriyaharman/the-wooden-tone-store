import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Admin Login", robots: { index: false } };

export default async function AdminLogin() {
  const s = await getSession();
  if (s?.role === "ADMIN") redirect("/admin");
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-7 shadow-card">
        <img src="/seed/logo.jpg" alt="" className="mx-auto h-16" />
        <h1 className="mt-4 text-center font-serif text-3xl font-semibold">Admin Panel</h1>
        <p className="text-center text-sm text-muted">The Wooden Tone</p>
        {s && <p className="mt-4 rounded-lg bg-tint p-3 text-xs text-teak-dark">You&apos;re signed in as a customer. Log in with an admin account.</p>}
        <AdminLoginForm />
      </div>
    </div>
  );
}
