import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata = { title: "Login / Register" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; tab?: string }> }) {
  const { next = "/account", tab } = await searchParams;
  if (await getSession()) redirect(next.startsWith("/") ? next : "/account");
  return (
    <div className="grid lg:grid-cols-2">
      <div className="relative hidden min-h-[620px] lg:block">
        <img src="/seed/banners/hero-sofa.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10" />
        <div className="absolute bottom-0 p-12 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E9B85E]">Welcome to The Wooden Tone</p>
          <p className="h-display mt-3 text-5xl">Your home, crafted in wood.</p>
          <p className="mt-3 text-white/85">Save your wishlist, track orders and check out faster.</p>
        </div>
      </div>
      <div className="flex justify-center px-4 py-12 md:py-20"><AuthForm next={next} initialTab={tab === "register" ? "register" : "login"} /></div>
    </div>
  );
}
