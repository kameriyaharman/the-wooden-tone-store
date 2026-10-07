import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowRight, Hammer, Headphones, Leaf, LayoutGrid, Truck } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs, Paragraphs, SectionHead } from "@/components/ui";

export const metadata = { title: "About Us" };

export default async function About() {
  const st = await getSettings();
  const n = await db.$count(s.categories, eq(s.categories.active, true));
  return (
    <>
      <section className="relative overflow-hidden bg-[#1d1611] text-white">
        <img src="/seed/banners/hero-sofa.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
        <div className="container-site relative py-20 md:py-28">
          <div className="[&_*]:!text-white/80"><Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "About Us" }]} /></div>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#E9B85E]">About {st.storeName}</p>
          <h1 className="h-display mt-3 max-w-xl text-[44px] md:text-[64px]">Designed in Wood, Built for Living</h1>
          <p className="mt-4 max-w-md text-white/85">A dedicated furniture manufacturer specialising in high-quality wooden furniture for Indian homes.</p>
        </div>
      </section>
      <section className="container-site grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <img src={st.aboutImage} alt="" className="aspect-[4/3] w-full rounded-3xl object-cover" />
        <div>
          <p className="eyebrow">Who we are</p>
          <h2 className="h-display mt-3 text-[36px] md:text-[46px]">{st.aboutHeading}</h2>
          <Paragraphs text={st.aboutText} className="mt-4 text-[15px] text-muted" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="card flex items-center gap-3 p-3.5"><span className="grid h-10 w-10 place-items-center rounded-lg bg-tint text-teak-dark"><LayoutGrid className="h-4 w-4" /></span><span><b className="block text-sm">{n}+ Categories</b><span className="text-xs text-muted">For every room</span></span></div>
            <div className="card flex items-center gap-3 p-3.5"><span className="grid h-10 w-10 place-items-center rounded-lg bg-tint text-teak-dark"><Truck className="h-4 w-4" /></span><span><b className="block text-sm">Pan-India</b><span className="text-xs text-muted">Free delivery</span></span></div>
          </div>
        </div>
      </section>
      <section className="bg-cream">
        <div className="container-site py-16 md:py-20">
          <SectionHead center eyebrow="Our promise" title={`Why choose ${st.storeName}`} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[[Leaf, "Solid Wood", "Seasoned sheesham, teak and mango wood — no particle board."], [Hammer, "Handcrafted", "Shaped, joined and finished by experienced artisans."], [Truck, "Free Shipping", "Safe, insured delivery to your doorstep across India."], [Headphones, "24/7 Support", "Call or WhatsApp us — before and after your purchase."]].map(([I, t, d]) => {
              const Icon = I as typeof Leaf;
              return (
                <div key={t as string} className="card p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-tint text-teak-dark"><Icon className="h-5 w-5" /></span>
                  <p className="mt-5 font-serif text-2xl font-semibold">{t as string}</p>
                  <p className="mt-1 text-sm text-muted">{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="container-site py-16 md:py-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">How it&apos;s made</p>
        <h2 className="h-display mt-2 text-[36px] md:text-[44px]">From timber to your home</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {[["Select the wood", "We source seasoned hardwood and check every plank for grain and moisture."], ["Craft by hand", "Artisans cut, carve and join each piece using time-tested joinery."], ["Finish & inspect", "Hand-sanded, polished and quality-checked before packing."], ["Deliver free", "Packed securely and delivered free to your doorstep."]].map(([t, d], i) => (
            <div key={t} className="lg:border-l lg:border-line lg:px-6 lg:first:border-0 lg:first:pl-0">
              <p className="font-serif text-5xl text-teak">0{i + 1}</p>
              <p className="mt-3 font-bold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#3A2411] to-[#1D140C] text-white">
        <div className="container-site py-20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E9B85E]">Visit or call us</p>
          <h2 className="h-display mx-auto mt-4 max-w-2xl text-[38px] md:text-[52px]">Let&apos;s find the right piece for your home</h2>
          <p className="mt-3 text-white/80">Talk to our team for sizes, finishes and custom requirements.</p>
          <Link href="/contact" className="btn mt-7 bg-white text-ink hover:bg-cream">Contact Us <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  );
}
