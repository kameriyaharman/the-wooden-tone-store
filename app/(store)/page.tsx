import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { ArrowRight, Headphones, Lock, RefreshCw, Truck, MessageSquare, Star } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { cardCols, listProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { ProductCard } from "@/components/product-card";
import { FaqList, HeroSlider, Scroller } from "@/components/home-client";
import { SectionHead, Paragraphs } from "@/components/ui";
import { InstagramIcon } from "@/components/icons";
import { inr, pctOff } from "@/lib/format";

export default async function Home() {
  const st = await getSettings();
  const [heroes, promos, featuredCats, trending, featured, reviews, faqs, catCount] = await Promise.all([
    db.select().from(s.banners).where(and(eq(s.banners.placement, "HERO"), eq(s.banners.active, true))).orderBy(asc(s.banners.sortOrder)),
    db.select().from(s.banners).where(and(eq(s.banners.placement, "PROMO"), eq(s.banners.active, true))).orderBy(asc(s.banners.sortOrder)).limit(2),
    db.select().from(s.categories).where(and(eq(s.categories.featured, true), eq(s.categories.active, true))).orderBy(asc(s.categories.sortOrder)),
    db.select(cardCols).from(s.products).where(and(eq(s.products.trending, true), eq(s.products.active, true))).orderBy(asc(s.products.sortOrder)).limit(10),
    db.select(cardCols).from(s.products).where(and(eq(s.products.featured, true), eq(s.products.active, true))).orderBy(asc(s.products.sortOrder)).limit(4),
    db.select().from(s.reviews).where(and(eq(s.reviews.approved, true), eq(s.reviews.showOnHome, true))).orderBy(desc(s.reviews.createdAt)).limit(8),
    db.select().from(s.faqs).where(eq(s.faqs.active, true)).orderBy(asc(s.faqs.sortOrder)),
    db.$count(s.categories, eq(s.categories.active, true)),
  ]);
  const rows = await Promise.all((st.homeSections || []).map(async (sec) => ({ sec, items: (await listProducts({ category: sec.categories.join(",") })).items })));
  const spot = featured[0];
  const insta = (st as { instagramImages?: string[] }).instagramImages?.length
    ? (st as { instagramImages: string[] }).instagramImages
    : [...trending, ...featured].map((p) => p.images[0]).filter(Boolean).slice(0, 6);

  return (
    <>
      <HeroSlider
        slides={heroes}
        marquee={st.marquee}
        spotlight={spot ? { name: spot.name.replace(/^The Wooden Tone /, ""), slug: spot.slug, price: inr(spot.price), image: spot.images[0], label: `Bestseller · ${pctOff(spot.price, spot.mrp)}% off` } : null}
      />

      {/* Categories */}
      <section className="container-site py-16 md:py-20">
        <SectionHead center eyebrow="Browse by category" title="Our Product Categories" sub={`${catCount}+ categories for every room — from beds and wardrobes to spice racks and pooja décor.`} />
        <div className="no-scrollbar -mx-4 mt-10 flex gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-8 md:px-0">
          {featuredCats.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="group w-24 shrink-0 text-center md:w-auto">
              <div className="rounded-2xl border border-line bg-cream p-1.5 transition group-hover:border-teak">
                <img src={c.image || ""} alt="" className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
              </div>
              <p className="mt-2 text-[13px] font-medium">{c.name}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center"><Link href="/categories" className="btn-outline">View all categories <ArrowRight className="h-4 w-4" /></Link></div>
      </section>

      {/* Story */}
      <section className="bg-cream">
        <div className="container-site grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="h-display mt-3 text-[38px] md:text-[48px]">{st.storyHeading}</h2>
            <Paragraphs text={st.storyText} className="mt-4 text-[15px] text-muted" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                [Headphones, "24/7 Support", "Talk to us anytime"],
                [Lock, "Secure Shopping", "Encrypted payments"],
                [Truck, "Free Shipping", "Across India"],
                [RefreshCw, "Money Return", "Hassle-free refunds"],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof Truck;
                return (
                  <div key={t as string} className="card flex items-center gap-3 p-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-tint text-teak-dark"><I className="h-4 w-4" /></span>
                    <span><span className="block text-sm font-bold">{t as string}</span><span className="text-xs text-muted">{d as string}</span></span>
                  </div>
                );
              })}
            </div>
            <Link href="/about" className="btn-gold mt-7">Read More <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <img src={st.aboutImage} alt="" className="ml-auto aspect-[4/5] w-[78%] rounded-3xl object-cover" />
            <div className="float-slow absolute left-0 top-8 rounded-2xl bg-walnut px-5 py-4 text-white shadow-xl">
              <p className="font-serif text-4xl font-semibold text-teak">{catCount}+</p>
              <p className="text-xs text-white/80">categories of handcrafted<br />furniture &amp; décor</p>
            </div>
            {featured[1] && <img src={featured[1].images[0]} alt="" className="absolute -bottom-6 left-[6%] aspect-square w-[42%] rounded-2xl border-[6px] border-white object-cover shadow-xl" />}
          </div>
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="container-site py-16 md:py-20">
          <div className="flex items-end justify-between">
            <SectionHead eyebrow="Now trending" title="Pieces worth lingering on" sub="Our most-loved designs this season." />
            <Link href="/shop?sort=featured" className="mb-1 text-[13px] font-semibold text-teak-dark hover:underline max-md:hidden">View all ↗</Link>
          </div>
          <Scroller className="mt-2">
            {trending.map((p) => (
              <Link key={p.id} href={`/product/${p.slug}`} data-cursor="view" className="group relative w-[68%] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[40%] md:w-[calc(20%-13px)]">
                <img src={p.images[0]} alt="" className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#E9B85E]">Trending</p>
                  <p className="mt-1 font-serif text-xl font-semibold leading-tight">{p.name.replace(/^The Wooden Tone /, "")}</p>
                  <p className="mt-1 text-xs text-white/85">{inr(p.price)}</p>
                </div>
              </Link>
            ))}
          </Scroller>
        </section>
      )}

      {/* Promo banners */}
      {promos.length > 0 && (
        <section className="grid md:grid-cols-2">
          {promos.map((b) => (
            <Link key={b.id} data-cursor="view" href={b.ctaLink || "/shop"} className="group relative block h-[300px] overflow-hidden md:h-[420px]">
              <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/10" />
              <div className="relative flex h-full flex-col justify-center p-8 text-white md:p-12">
                {b.eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#E9B85E]">{b.eyebrow}</p>}
                <h3 className="h-display mt-2 max-w-sm text-[34px] md:text-[42px]">{b.title}</h3>
                {b.subtitle && <p className="mt-2 text-sm text-white/85">{b.subtitle}</p>}
                {b.ctaLabel && <span className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">{b.ctaLabel} <ArrowRight className="h-4 w-4" /></span>}
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Category rows */}
      <div className="container-site space-y-16 py-16 md:py-20">
        {rows.filter((r) => r.items.length).map(({ sec, items }) => (
          <section key={sec.title}>
            <SectionHead eyebrow={sec.eyebrow} title={sec.title} href={`/shop?category=${sec.categories.join(",")}`} />
            <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:px-0">
              {items.slice(0, 5).map((p) => (
                <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] md:w-auto"><ProductCard p={p} /></div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Featured collection */}
      {featured.length >= 2 && (
        <section className="bg-cream">
          <div className="container-site py-16 md:py-20">
            <p className="eyebrow !text-muted">Featured</p>
            <h2 className="h-display mt-2 text-[34px] md:text-[44px]">A small collection. A big impression.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-[1.55fr_1fr]">
              <FeatureTile p={featured[0]} big />
              <div className="grid gap-4">
                {featured.slice(1, 4).map((p) => <FeatureTile key={p.id} p={p} />)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="container-site py-16 md:py-20">
          <SectionHead center eyebrow="Customer stories" title="What Our Happy Customers Say" />
          <div className="no-scrollbar -mx-4 mt-10 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:px-0">
            {reviews.map((r) => (
              <figure key={r.id} className="card w-[80%] shrink-0 snap-start p-5 md:w-auto">
                <div className="flex">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-teak text-teak" : "text-line"}`} />)}</div>
                <blockquote className="mt-3 text-sm leading-relaxed text-ink">“{r.text}”</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-tint font-bold text-teak-dark">{r.name[0]}</span>
                  <span><span className="block text-sm font-bold">{r.name}</span><span className="text-xs text-muted">{r.city}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Custom order CTA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#3A2411] to-[#1D140C] text-white">
        <div className="absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-teak/25 blur-3xl" />
        <div className="container-site relative py-20 text-center md:py-28">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E9B85E]">Custom orders</p>
          <h2 className="h-display mx-auto mt-4 max-w-3xl text-[38px] md:text-[56px]">Get Your Design Crafted in Solid Wood</h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] text-white/80">Share a photo or sketch — our craftsmen will build it to your size and finish.</p>
          <Link href="/custom-order" className="btn mt-8 bg-white text-ink hover:bg-cream">Start a Custom Order <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section id="faq" className="container-site scroll-mt-28 py-16 md:py-20">
          <SectionHead center eyebrow="FAQ" title="Frequently Asked Questions" />
          <FaqList items={faqs} />
        </section>
      )}

      {/* Instagram */}
      {insta.length > 0 && (
        <section className="container-site pb-16 md:pb-20">
          <SectionHead center eyebrow={st.instagramHandle} title="Follow Us on Instagram" />
          <div className="mt-8 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
            {insta.map((src, i) => (
              <a key={i} href={st.social?.instagram || "#"} target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-xl">
                <img src={src} alt="" className="aspect-square w-full object-cover transition group-hover:scale-105" loading="lazy" />
                <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100"><InstagramIcon className="h-6 w-6" /></span>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function FeatureTile({ p, big = false }: { p: { slug: string; name: string; price: number; images: string[] }; big?: boolean }) {
  return (
    <Link data-cursor="view" href={`/product/${p.slug}`} className={`group relative block overflow-hidden rounded-2xl ${big ? "h-[420px] md:h-full md:min-h-[520px]" : "h-[160px] md:h-auto md:min-h-[164px]"}`}>
      <img src={p.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div className="absolute bottom-0 p-5 text-white md:p-6">
        {big && <p className="text-[10px] font-bold uppercase tracking-widest text-[#E9B85E]">Spotlight</p>}
        <p className={`font-serif font-semibold leading-tight ${big ? "mt-1 text-3xl md:text-4xl" : "text-xl"}`}>{p.name.replace(/^The Wooden Tone /, "")}</p>
        <p className="mt-1 text-xs text-white/85">{inr(p.price)}</p>
      </div>
    </Link>
  );
}
