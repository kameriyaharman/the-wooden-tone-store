"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Slide = { id: string; eyebrow: string | null; title: string; highlight: string | null; subtitle: string | null; image: string; ctaLabel: string | null; ctaLink: string | null; cta2Label: string | null; cta2Link: string | null };

export function HeroSlider({ slides, marquee, spotlight }: { slides: Slide[]; marquee: string[]; spotlight?: { name: string; slug: string; price: string; image: string; label: string } | null }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);
  const words = [...marquee, ...marquee, ...marquee, ...marquee];
  return (
    <section className="relative bg-[#1d1611] text-white">
      <div className="relative h-[420px] overflow-hidden md:h-[460px]">
        {slides.map((s, k) => (
          <div key={s.id} className={`absolute inset-0 transition-opacity duration-700 ${k === i ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={k !== i}>
            <img src={s.image} alt="" className={`absolute inset-0 h-full w-full object-cover ${k === i ? "kenburns" : ""}`} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
            <div className="container-site relative flex h-full flex-col justify-center pb-14">
              {s.eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#E9B85E]">{s.eyebrow}</p>}
              <h1 className="h-display mt-3 max-w-2xl text-[38px] md:text-[60px]">
                {s.title}
                {s.highlight && <><br /><em className="font-medium text-[#E9B85E]">{s.highlight}</em></>}
              </h1>
              {s.subtitle && <p className="mt-3 max-w-md text-[15px] text-white/85">{s.subtitle}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {s.ctaLabel && s.ctaLink && <Link href={s.ctaLink} className="btn-gold">{s.ctaLabel} <ArrowRight className="h-4 w-4" /></Link>}
                {s.cta2Label && s.cta2Link && <Link href={s.cta2Link} className="btn border border-white/60 text-white hover:bg-white/10">{s.cta2Label}</Link>}
              </div>
            </div>
          </div>
        ))}
        {spotlight && (
          <Link href={`/product/${spotlight.slug}`} className="absolute right-6 top-8 hidden items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-2.5 pr-5 backdrop-blur-md lg:flex">
            <img src={spotlight.image} alt="" className="h-14 w-16 rounded-lg object-cover" />
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#E9B85E]">{spotlight.label}</span>
              <span className="block font-serif text-lg font-semibold leading-tight">{spotlight.name}</span>
              <span className="text-xs text-white/80">{spotlight.price}</span>
            </span>
          </Link>
        )}
        {n > 1 && (
          <div className="container-site pointer-events-none absolute inset-x-0 bottom-16 flex items-center justify-between">
            <div className="pointer-events-auto flex gap-1.5">
              {slides.map((_, k) => (
                <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className={`h-1.5 rounded-full transition-all ${k === i ? "w-7 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
            <div className="pointer-events-auto flex gap-2">
              <button onClick={() => setI((i - 1 + n) % n)} className="grid h-10 w-10 place-items-center rounded-full border border-white/40 hover:bg-white/10" aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setI((i + 1) % n)} className="grid h-10 w-10 place-items-center rounded-full border border-white/40 hover:bg-white/10" aria-label="Next"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-white/10 bg-[#1d1611]/90">
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap py-3 font-serif text-lg uppercase tracking-[0.3em] text-white/90">
            {words.map((w, k) => <span key={k} className="flex items-center gap-10">{w}<span className="text-teak">✦</span></span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Scroller({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className={className}>
      <div className="mb-4 flex justify-end gap-2 max-md:hidden">
        <button onClick={() => go(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-teak" aria-label="Scroll left"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => go(1)} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-teak" aria-label="Scroll right"><ChevronRight className="h-4 w-4" /></button>
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
    <div className="mx-auto mt-8 max-w-3xl space-y-3">
      {items.map((f) => (
        <div key={f.id} className="card overflow-hidden">
          <button onClick={() => setOpen(open === f.id ? null : f.id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold" aria-expanded={open === f.id}>
            {f.question}
            <ChevronDown className={`h-4 w-4 shrink-0 transition ${open === f.id ? "rotate-180" : ""}`} />
          </button>
          {open === f.id && <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.answer}</p>}
        </div>
      ))}
    </div>
  );
}
