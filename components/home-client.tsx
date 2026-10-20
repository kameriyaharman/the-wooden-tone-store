"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./product-card";
import type { CardProduct } from "@/lib/catalog";

type Slide = { id: string; eyebrow: string | null; title: string; highlight: string | null; subtitle: string | null; image: string; ctaLabel: string | null; ctaLink: string | null; cta2Label: string | null; cta2Link: string | null };

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);
  return (
    <section className="relative bg-[#231A13] text-white">
      <div className="relative h-[520px] overflow-hidden md:h-[620px]">
        {slides.map((s, k) => (
          <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={k !== i}>
            <img src={s.image} alt="" className={`absolute inset-0 h-full w-full object-cover ${k === i ? "kenburns" : ""}`} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />
            <div className="container-site relative flex h-full flex-col items-center justify-end pb-20 text-center md:pb-24">
              {s.eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-[#D9BC86]">{s.eyebrow}</p>}
              <h1 className="mt-3 max-w-3xl font-serif text-[40px] font-medium leading-[1.05] md:text-[68px]">
                {s.title}
                {s.highlight && <> <em className="font-normal text-[#D9BC86]">{s.highlight}</em></>}
              </h1>
              {s.subtitle && <p className="mt-3 max-w-lg text-[15px] font-light text-white/85">{s.subtitle}</p>}
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                {s.ctaLabel && s.ctaLink && <Link href={s.ctaLink} className="btn bg-white text-ink hover:bg-ivory">{s.ctaLabel}</Link>}
                {s.cta2Label && s.cta2Link && <Link href={s.cta2Link} className="btn border border-white/70 text-white hover:bg-white hover:text-ink">{s.cta2Label}</Link>}
              </div>
            </div>
          </div>
        ))}
        {n > 1 && (
          <>
            <button onClick={() => setI((i - 1 + n) % n)} className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center border border-white/40 text-white transition hover:bg-white hover:text-ink md:grid" aria-label="Previous slide"><ChevronLeft className="h-5 w-5" strokeWidth={1.5} /></button>
            <button onClick={() => setI((i + 1) % n)} className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center border border-white/40 text-white transition hover:bg-white hover:text-ink md:grid" aria-label="Next slide"><ChevronRight className="h-5 w-5" strokeWidth={1.5} /></button>
            <div className="absolute inset-x-0 bottom-7 flex justify-center gap-2">
              {slides.map((_, k) => (
                <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className={`h-[3px] transition-all ${k === i ? "w-10 bg-white" : "w-5 bg-white/45"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Slow bilingual tagline band that runs under the hero. */
export function TaglineMarquee({ words }: { words: string[] }) {
  if (!words.length) return null;
  const run = [...words, ...words, ...words, ...words];
  return (
    <div className="overflow-hidden border-b border-line bg-cream">
      <div className="flex w-max animate-marquee-slow gap-8 whitespace-nowrap py-4 font-serif text-[20px] italic text-ink/85 md:text-[22px]">
        {run.map((w, k) => <span key={k} className="flex items-center gap-8">{w}<span className="not-italic text-teak">/</span></span>)}
      </div>
    </div>
  );
}

/** Gharana-style tabbed product grid with a "Show more" link per tab. */
export function ProductTabs({ tabs, title, eyebrow }: { tabs: { label: string; href: string; items: CardProduct[] }[]; title?: string; eyebrow?: string }) {
  const [t, setT] = useState(0);
  const live = tabs.filter((x) => x.items.length);
  const cur = live[Math.min(t, live.length - 1)];
  if (!cur) return null;
  return (
    <div>
      {title && (
        <div className="text-center">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="h-section mt-2">{title}</h2>
        </div>
      )}
      <div role="tablist" className={`no-scrollbar -mx-4 flex justify-start gap-6 overflow-x-auto px-4 md:justify-center md:gap-10 ${title ? "mt-6" : ""}`}>
        {live.map((x, k) => (
          <button
            key={x.label}
            role="tab"
            aria-selected={k === t}
            onClick={() => setT(k)}
            className={`shrink-0 border-b pb-2 text-[13px] font-medium uppercase tracking-[0.2em] transition md:text-[14px] ${k === t ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div key={cur.label} className="animate-ann-in mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
        {cur.items.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      <div className="mt-10 text-center"><Link href={cur.href} className="btn-outline">Show more</Link></div>
    </div>
  );
}

/** Numbered "why choose us" cards in a horizontal slider. */
export function WhyChoose({ items }: { items: { title: string; text: string; tags: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
        {items.map((it, k) => (
          <article key={it.title} className="w-[84%] shrink-0 snap-start border border-line bg-ivory p-7 md:w-auto md:p-9">
            <p className="font-serif text-[56px] font-medium leading-none text-teak/70">{String(k + 1).padStart(2, "0")}</p>
            <h3 className="mt-4 font-serif text-[26px] font-medium leading-tight">{it.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{it.text}</p>
            <p className="mt-5 font-serif text-[16px] italic text-teak-dark">{it.tags}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-4 md:hidden">
        <button onClick={() => go(-1)} className="grid h-9 w-9 place-items-center border border-line" aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-[11px] uppercase tracking-[0.3em] text-muted">Scroll</span>
        <button onClick={() => go(1)} className="grid h-9 w-9 place-items-center border border-line" aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function Scroller({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className={className}>
      <div className="mb-4 flex justify-end gap-2 max-md:hidden">
        <button onClick={() => go(-1)} className="grid h-9 w-9 place-items-center border border-line hover:border-ink" aria-label="Scroll left"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => go(1)} className="grid h-9 w-9 place-items-center border border-line hover:border-ink" aria-label="Scroll right"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div ref={ref} onScroll={(e) => { const el = e.currentTarget; setP(el.scrollLeft / Math.max(1, el.scrollWidth - el.clientWidth)); }} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        {children}
      </div>
      <div className="mt-6 h-0.5 rounded bg-line"><div className="h-full rounded bg-ink transition-all" style={{ width: `${Math.max(20, p * 100)}%` }} /></div>
    </div>
  );
}

export function FaqList({ items }: { items: { id: string; question: string; answer: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="mx-auto mt-8 max-w-3xl border-t border-line">
      {items.map((f) => (
        <div key={f.id} className="border-b border-line">
          <button onClick={() => setOpen(open === f.id ? null : f.id)} className="flex w-full items-center justify-between gap-4 px-1 py-5 text-left font-serif text-[20px] font-medium" aria-expanded={open === f.id}>
            {f.question}
            <ChevronDown className={`h-4 w-4 shrink-0 transition ${open === f.id ? "rotate-180" : ""}`} />
          </button>
          {open === f.id && <p className="px-1 pb-5 text-[15px] leading-relaxed text-muted">{f.answer}</p>}
        </div>
      ))}
    </div>
  );
}
