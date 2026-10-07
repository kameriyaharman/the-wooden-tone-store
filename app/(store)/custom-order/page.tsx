import { Hammer, Leaf, Ruler, Truck } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs } from "@/components/ui";
import { CustomOrderForm } from "@/components/forms";

export const metadata = { title: "Custom Order" };

export default async function CustomOrder() {
  const st = await getSettings();
  return (
    <>
      <section className="relative overflow-hidden bg-[#1d1611] text-white">
        <img src="/seed/products/desk.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/30" />
        <div className="container-site relative py-20 md:py-24">
          <div className="[&_*]:!text-white/80"><Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Custom Order" }]} /></div>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.24em] text-[#E9B85E]">Made to your size</p>
          <h1 className="h-display mt-3 max-w-xl text-[44px] md:text-[60px]">Get Your Design Crafted in Solid Wood</h1>
          <p className="mt-4 max-w-md text-white/85">Share a photo, sketch or reference — our craftsmen will build it in your size, wood and finish.</p>
        </div>
      </section>
      <section className="container-site grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {[["Share your idea", "Upload a photo or sketch with sizes."], ["Get a quote", "We confirm design, wood & price within 48 hours."], ["We craft it", "Built by hand in our workshop."], ["Free delivery", "Delivered and assembled at your home."]].map(([t, d], i) => (
          <div key={t} className="lg:border-l lg:border-line lg:px-6 lg:first:border-0 lg:first:pl-0">
            <p className="font-serif text-5xl text-teak">0{i + 1}</p>
            <p className="mt-3 font-bold">{t}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>
      <section className="bg-cream">
        <div className="container-site grid items-start gap-6 py-12 md:py-16 lg:grid-cols-[1.6fr_1fr]">
          <div className="card p-5 md:p-7">
            <h2 className="font-serif text-3xl font-semibold">Tell us about your piece</h2>
            <div className="mt-5"><CustomOrderForm /></div>
          </div>
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="card p-5">
              <p className="font-serif text-2xl font-semibold">Why go custom?</p>
              <ul className="mt-4 space-y-3 text-sm font-semibold">
                {[[Ruler, "Perfect fit for your space"], [Leaf, "Choose wood & finish"], [Hammer, "Handcrafted by artisans"], [Truck, "Free delivery & assembly"]].map(([I, t]) => {
                  const Icon = I as typeof Ruler;
                  return <li key={t as string} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-tint text-teak-dark"><Icon className="h-4 w-4" /></span>{t as string}</li>;
                })}
              </ul>
            </div>
            <div className="card p-2">
              <img src={st.customOrderImage} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
              <p className="px-2 py-2 text-xs text-muted">Recent custom work — bed with matching side tables.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
