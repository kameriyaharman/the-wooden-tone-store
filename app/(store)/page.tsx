import Link from "next/link";
import { unstable_cache } from "next/cache";
import { and, asc, desc, eq } from "drizzle-orm";
import { ArrowRight, Headphones, Lock, RefreshCw, Truck, Star } from "lucide-react";
import { db, schema as s } from "@/lib/db";
import { cardCols, listProducts, navData } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { FaqList, HeroSlider, ProductTabs, TaglineMarquee, WhyChoose } from "@/components/home-client";
import { SectionHead, Paragraphs } from "@/components/ui";
import { InstagramIcon } from "@/components/icons";
import { inr } from "@/lib/format";

const homeData = unstable_cache(() =>
  Promise.all([
    db.select().from(s.banners).where(and(eq(s.banners.placement, "HERO"), eq(s.banners.active, true))).orderBy(asc(s.banners.sortOrder)),
    db.select().from(s.banners).where(and(eq(s.banners.placement, "PROMO"), eq(s.banners.active, true))).orderBy(asc(s.banners.sortOrder)).limit(2),
    db.select().from(s.categories).where(and(eq(s.categories.featured, true), eq(s.categories.active, true))).orderBy(asc(s.categories.sortOrder)),
    db.select(cardCols).from(s.products).where(and(eq(s.products.trending, true), eq(s.products.active, true))).orderBy(asc(s.products.sortOrder)).limit(10),
    db.select(cardCols).from(s.products).where(and(eq(s.products.featured, true), eq(s.products.active, true))).orderBy(asc(s.products.sortOrder)).limit(4),
    db.select(cardCols).from(s.products).where(eq(s.products.active, true)).orderBy(desc(s.products.createdAt)).limit(8),
    db.select().from(s.reviews).where(and(eq(s.reviews.approved, true), eq(s.reviews.showOnHome, true))).orderBy(desc(s.reviews.createdAt)).limit(8),
    db.select().from(s.faqs).where(eq(s.faqs.active, true)).orderBy(asc(s.faqs.sortOrder)),
    db.$count(s.categories, eq(s.categories.active, true)),
  ]),
  ["home-data"], { tags: ["catalog", "settings"], revalidate: 120 });

const WHY = [
  { title: "Every Grain Has a Story", text: "Seasoned sheesham, teak and mango wood, shaped by Saharanpur craftsmen whose families have worked wood for generations.", tags: "Handcrafted • Solid Wood • Timeless" },
  { title: "Made to Be Lived In", text: "Sturdy joinery, hand-rubbed finishes and honest proportions — furniture built for real homes, everyday use and family dinners.", tags: "Durable • Practical • Warm" },
  { title: "Crafted for Today's Home", text: "Rooted in tradition yet designed for modern living, and made to your size when you need something truly your own.", tags: "Custom Sizes • Free Shipping • Easy Returns" },
];

export default async function Home() {
  const st = await getSettings();
  const [[heroes, promos, featuredCats, trending, featured, newest, reviews, faqs, catCount], rooms] = await Promise.all([homeData(), navData()]);
  const rows = await Promise.all((st.homeSections || []).map(async (sec) => ({ sec, items: (await listProducts({ category: sec.categories.join(",") })).items })));
  const edits = rooms.filter((r) => r.image || r.categories[0]?.image).slice(0, 3);
  const insta = (st as { instagramImages?: string[] }).instagramImages?.length
    ? (st as { instagramImages: string[] }).instagramImages
    : [...trending, ...featured].map((p) => p.images[0]).filter(Boolean).slice(0, 6);

  return (
    <>
      <HeroSlider slides={heroes} />
      <TaglineMarquee words={st.marquee} />

      {/* What are you looking for */}
      {featuredCats.length > 0 && (
        <section className="container-site py-16 md:py-20">
          <SectionHead center title="What Are You Looking For ?" />
          <div className="no-scrollbar -mx-4 mt-10 flex gap-4 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:justify-center md:gap-6 md:overflow-visible md:px-0">
            {featuredCats.map((c) => (
              <Link key={c.id} href={`/shop?category=${c.slug}`} className="group w-[38%] shrink-0 text-center sm:w-[24%] md:w-[calc(25%-18px)] lg:w-[calc(12.5%-21px)]">
                <div className="arch overflow-hidden bg-cream">
                  <img src={c.image || ""} alt="" className="aspect-[3/4] w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <p className="mt-3 text-[12px] font-medium uppercase tracking-[0.2em] transition-colors group-hover:text-teak-dark">{c.name}</p>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center"><Link href="/categories" className="btn-outline">All categories</Link></div>
        </section>
      )}

      {/* Category tabs (admin: Settings → homepage sections) */}
      {rows.some((r) => r.items.length) && (
        <section className="container-site pb-16 md:pb-20">
          <ProductTabs
            title="Curated For Your Home"
            eyebrow="Shop the collection"
            tabs={rows.map(({ sec, items }) => ({ label: sec.title, href: `/shop?category=${sec.categories.join(",")}`, items }))}
          />
        </section>
      )}

      {/* Promo banners */}
      {promos.length > 0 && (
        <section className="grid gap-px bg-line md:grid-cols-2">
          {promos.map((b) => (
            <Link key={b.id} data-cursor="view" href={b.ctaLink || "/shop"} className="group relative block h-[360px] overflow-hidden md:h-[520px]">
              <img src={b.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="relative flex h-full flex-col items-center justify-end p-8 text-center text-white md:p-12">
                {b.eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#D9BC86]">{b.eyebrow}</p>}
                <h3 className="mt-2 max-w-md font-serif text-[34px] font-medium leading-tight md:text-[44px]">{b.title}</h3>
                {b.subtitle && <p className="mt-2 text-sm font-light text-white/85">{b.subtitle}</p>}
                {b.ctaLabel && <span className="mt-5 border-b border-white pb-1 text-[11px] font-medium uppercase tracking-[0.24em]">{b.ctaLabel}</span>}
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Why choose */}
      <section className="bg-cream">
        <div className="container-site py-16 md:py-24">
          <SectionHead center title={`Why Choose ${st.storeName.replace(/^The /, "")}`} sub="Every piece is a celebration of India's woodworking heritage — made for homes that value craftsmanship, honesty and furniture that lasts." />
          <div className="mt-12"><WhyChoose items={WHY} /></div>
        </div>
      </section>

      {/* Bestsellers / New arrivals */}
      {(trending.length > 0 || newest.length > 0) && (
        <section className="container-site py-16 md:py-20">
          <ProductTabs
            tabs={[
              { label: "Bestsellers", href: "/shop?sort=featured", items: trending },
              { label: "New Arrivals", href: "/shop?sort=new", items: newest },
            ]}
          />
        </section>
      )}

      {/* Lifestyle edits by room */}
      {edits.length > 0 && (
        <section className="container-site pb-16 md:pb-20">
          <div className={`grid gap-4 md:gap-6 ${edits.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {edits.map((r) => (
              <Link key={r.slug} data-cursor="view" href={`/shop?room=${r.slug}`} className="group relative block overflow-hidden">
                <img src={r.image || r.categories[0]?.image || ""} alt="" className="aspect-[4/5] w-full object-cover transition duration-1000 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-7 text-center text-white">
                  <h3 className="font-serif text-[30px] font-medium uppercase tracking-[0.12em]">{r.name}</h3>
                  <span className="mt-3 border-b border-white pb-1 text-[11px] font-medium uppercase tracking-[0.24em]">Shop now</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Spotlight */}
      {featured.length >= 2 && (
        <section className="bg-cream">
          <div className="container-site py-16 md:py-20">
            <SectionHead center eyebrow="The Spotlight" title="A Small Collection, A Big Impression" />
            <div className="mt-10 grid gap-4 md:grid-cols-[1.55fr_1fr]">
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
          <SectionHead center eyebrow="Customer stories" title="Loved in Homes Across India" />
          <div className="no-scrollbar -mx-4 mt-10 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:px-0">
            {reviews.map((r) => (
              <figure key={r.id} className="w-[80%] shrink-0 snap-start border border-line bg-white p-6 text-center md:w-auto">
                <div className="flex justify-center">{[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-teak text-teak" : "text-line"}`} />)}</div>
                <blockquote className="mt-4 font-serif text-[18px] italic leading-relaxed text-ink">“{r.text}”</blockquote>
                <figcaption className="mt-5">
                  <span className="block text-[12px] font-medium uppercase tracking-[0.2em]">{r.name}</span>
                  <span className="text-xs text-muted">{r.city}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Story */}
      <section className="border-y border-line bg-ivory">
        <div className="container-site grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="relative mx-auto w-full max-w-md md:order-2 md:max-w-none">
            <img src={st.aboutImage} alt="" className="arch ml-auto aspect-[4/5] w-[80%] object-cover" />
            <div className="float-slow absolute left-0 top-10 bg-ink px-6 py-5 text-white shadow-xl">
              <p className="font-serif text-5xl font-medium text-[#D9BC86]">{catCount}+</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/80">categories of<br />handcrafted furniture</p>
            </div>
          </div>
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="mt-3 font-serif text-[38px] font-medium leading-[1.1] md:text-[50px]">{st.storyHeading}</h2>
            <Paragraphs text={st.storyText} className="mt-5 text-[15px] text-muted" />
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6">
              {[
                [Headphones, "Personal Support", "Talk to us anytime"],
                [Lock, "Secure Shopping", "Encrypted payments"],
                [Truck, "Free Shipping", "Across India"],
                [RefreshCw, "Easy Returns", "Hassle-free refunds"],
              ].map(([Icon, t, d]) => {
                const I = Icon as typeof Truck;
                return (
                  <div key={t as string} className="flex items-start gap-3">
                    <I className="mt-0.5 h-5 w-5 shrink-0 text-teak" strokeWidth={1.5} />
                    <span><span className="block text-[12px] font-medium uppercase tracking-[0.14em]">{t as string}</span><span className="text-[13px] text-muted">{d as string}</span></span>
                  </div>
                );
              })}
            </div>
            <Link href="/about" className="btn-dark mt-8">Read our story <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* Custom order CTA */}
      <section className="relative overflow-hidden bg-ink text-white">
        {st.customOrderImage && <img src={st.customOrderImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" loading="lazy" />}
        <div className="container-site relative py-20 text-center md:py-28">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#D9BC86]">Custom orders</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-[38px] font-medium leading-tight md:text-[58px]">Your Design, Crafted in Solid Wood</h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] font-light text-white/80">Share a photo or sketch — our craftsmen will build it to your size and finish.</p>
          <Link href="/custom-order" className="btn mt-8 bg-white text-ink hover:bg-ivory">Start a custom order</Link>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section id="faq" className="container-site scroll-mt-40 py-16 md:py-20">
          <SectionHead center eyebrow="FAQ" title="Frequently Asked Questions" />
          <FaqList items={faqs} />
        </section>
      )}

      {/* Instagram */}
      {insta.length > 0 && (
        <section className="container-site pb-16 md:pb-20">
          <SectionHead center eyebrow={st.instagramHandle} title="Follow Us on Instagram" />
          <div className="mt-10 grid grid-cols-3 gap-1.5 md:grid-cols-6 md:gap-2">
            {insta.map((src, i) => (
              <a key={i} href={st.social?.instagram || "#"} target="_blank" rel="noreferrer" className="group relative overflow-hidden">
                <img src={src} alt="" className="aspect-square w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
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
    <Link data-cursor="view" href={`/product/${p.slug}`} className={`group relative block overflow-hidden ${big ? "h-[420px] md:h-full md:min-h-[520px]" : "h-[160px] md:h-auto md:min-h-[164px]"}`}>
      <img src={p.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
      <div className="absolute bottom-0 p-5 text-white md:p-6">
        {big && <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#D9BC86]">Spotlight</p>}
        <p className={`font-serif font-medium leading-tight ${big ? "mt-1 text-3xl md:text-4xl" : "text-xl"}`}>{p.name.replace(/^The Wooden Tone /, "")}</p>
        <p className="mt-1 text-xs text-white/85">{inr(p.price)}</p>
      </div>
    </Link>
  );
}
