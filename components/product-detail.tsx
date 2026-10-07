"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BadgeCheck, FileText, Headphones, Heart, Lock, MessageSquareQuote, RefreshCw, Ruler, Share2, ShoppingCart, Sparkles, Truck, X, Zap, ZoomIn } from "lucide-react";
import { useStore } from "./store-provider";
import { QtyStepper } from "./cart-ui";
import { Stars } from "./product-card";
import { inr, pctOff } from "@/lib/format";
import type { Finish, SizeOpt } from "@/lib/db/schema";

type P = {
  id: string; slug: string; name: string; price: number; mrp: number; images: string[]; stock: number; woodType: string | null;
  finishes: Finish[]; sizes: SizeOpt[]; shipsIn: string; ratingAvg: number; ratingCount: number;
};

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [tx, setTx] = useState<number | null>(null);
  const imgs = images.length ? images : [""];
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="no-scrollbar flex gap-2.5 overflow-x-auto md:w-[76px] md:flex-col">
        {imgs.map((src, k) => (
          <button key={k} onClick={() => setI(k)} className={`shrink-0 overflow-hidden rounded-xl border-2 ${k === i ? "border-teak" : "border-transparent"}`} aria-label={`Image ${k + 1}`}>
            <img src={src} alt="" className="h-[68px] w-[68px] object-cover md:h-[72px] md:w-[72px]" />
          </button>
        ))}
      </div>
      <div
        className="relative flex-1 overflow-hidden rounded-2xl bg-cream"
        onTouchStart={(e) => setTx(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (tx === null) return;
          const d = e.changedTouches[0].clientX - tx;
          if (Math.abs(d) > 40) setI((x) => (x + (d < 0 ? 1 : -1) + imgs.length) % imgs.length);
          setTx(null);
        }}
      >
        <img key={i} src={imgs[i]} alt={name} data-cursor="view" onClick={() => setZoom(true)} className="aspect-square w-full animate-[page-in_.4s_ease] object-cover md:aspect-[4/4.2]" />
        <button onClick={() => setZoom(true)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white shadow" aria-label="Zoom image"><ZoomIn className="h-4 w-4" /></button>
        {imgs.length > 1 && <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{i + 1} / {imgs.length}</span>}
      </div>
      {zoom && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/90 p-4" onClick={() => setZoom(false)}>
          <img src={imgs[i]} alt={name} className="max-h-full max-w-full rounded-lg object-contain" />
          <button className="absolute right-4 top-4 text-white" aria-label="Close"><X className="h-7 w-7" /></button>
        </div>
      )}
    </div>
  );
}

export function BuyBox({ p, specLine }: { p: P; specLine: string }) {
  const router = useRouter();
  const { add, toggleWish, inWish, ready, showToast } = useStore();
  const defSize = p.sizes.find((s) => s.priceDelta === 0) || p.sizes[0];
  const [size, setSize] = useState<SizeOpt | undefined>(defSize);
  const [finish, setFinish] = useState<Finish | undefined>(p.finishes[0]);
  const [qty, setQty] = useState(1);
  const delta = size?.priceDelta || 0;
  const price = p.price + delta;
  const mrp = Math.max(p.mrp + delta, price);
  const off = pctOff(price, mrp);
  const out = p.stock <= 0;
  const wished = ready && inWish(p.id);
  const item = useMemo(() => ({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] || null, price, mrp, qty, finish: finish?.name || null, size: size?.name || null, maxQty: p.stock }), [p, price, mrp, qty, finish, size]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else { await navigator.clipboard.writeText(url); showToast("Link copied"); }
    } catch {}
  };

  const actions = (compact = false) => (
    <div className={`grid gap-2.5 ${compact ? "grid-cols-2" : "grid-cols-[1fr_1fr_auto_auto]"}`}>
      <button disabled={out} onClick={() => add(item)} className="btn-gold"><ShoppingCart className="h-4 w-4" /> Add to Cart</button>
      <button disabled={out} onClick={() => { add(item, false); router.push("/checkout"); }} className="btn-dark">Buy Now</button>
      {!compact && (
        <>
          <button onClick={() => toggleWish({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0] || null, price: p.price, mrp: p.mrp })} className="btn-outline !px-3.5" aria-label="Wishlist"><Heart className={`h-4 w-4 ${wished ? "fill-sale text-sale" : ""}`} /></button>
          <button onClick={share} className="btn-outline !px-3.5" aria-label="Share"><Share2 className="h-4 w-4" /></button>
        </>
      )}
    </div>
  );

  return (
    <div className="card p-5 md:p-7">
      {off > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-sale px-2.5 py-1 text-[11px] font-bold uppercase text-white"><Zap className="h-3 w-3 fill-white" /> Save {off}%</span>}
      <h1 className="h-display mt-3 text-[32px] md:text-[40px]">{p.name}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-muted">
        <Stars value={p.ratingAvg} /> <span>{p.ratingAvg.toFixed(1)} ({p.ratingCount})</span>
        {specLine && <span>{specLine}</span>}
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5EE] px-2.5 py-1 text-xs font-semibold text-stock"><BadgeCheck className="h-3.5 w-3.5" /> Authentic product</span>
      </div>
      <div className="mt-5 rounded-xl border border-[#EADFCB] bg-gradient-to-b from-[#FFFDF9] to-cream p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Your price</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-3">
          <span className="text-[34px] font-extrabold tracking-tight">{inr(price)}</span>
          {mrp > price && <span className="text-lg text-muted line-through">{inr(mrp)}</span>}
          {mrp > price && <span className="rounded-full bg-[#E8F5EE] px-2.5 py-1 text-xs font-semibold text-stock">You save {inr(mrp - price)}</span>}
        </div>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted"><Truck className="h-3.5 w-3.5" /> Free delivery across India · Inclusive of all taxes</p>
      </div>
      {p.finishes.length > 0 && (
        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-sm"><Sparkles className="h-3.5 w-3.5 text-teak" /><b>Finish:</b> <span className="text-muted">{finish?.name}</span></p>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {p.finishes.map((f) => (
              <button key={f.name} onClick={() => setFinish(f)} title={f.name} aria-label={f.name}
                className={`h-9 w-9 rounded-full p-0.5 ring-2 ring-offset-2 transition ${finish?.name === f.name ? "ring-teak" : "ring-transparent hover:ring-line"}`}>
                <span className="block h-full w-full rounded-full" style={{ background: f.color }} />
              </button>
            ))}
          </div>
        </div>
      )}
      {p.sizes.length > 0 && (
        <div className="mt-5">
          <p className="flex items-center gap-1.5 text-sm"><Ruler className="h-3.5 w-3.5 text-teak" /><b>Size:</b> <span className="text-muted">{size?.label}</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.sizes.map((s) => (
              <button key={s.name} onClick={() => setSize(s)} className={`rounded-full border px-5 py-2 text-sm ${size?.name === s.name ? "border-teak bg-tint font-semibold text-teak-dark" : "border-line hover:border-teak"}`}>{s.name}</button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <QtyStepper value={qty} max={Math.max(1, p.stock)} onChange={setQty} />
        {out ? (
          <span className="rounded-full bg-[#FDECEE] px-3 py-1.5 text-xs font-semibold text-sale">Out of stock</span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-[#E8F5EE] px-3 py-1.5 text-xs font-semibold text-stock">
            <span className="h-1.5 w-1.5 rounded-full bg-stock" /> In Stock — ships in {p.shipsIn}{p.stock <= 3 ? ` · only ${p.stock} left` : ""}
          </span>
        )}
      </div>
      <div className="mt-5 hidden md:block">{actions()}</div>
      <div className="mt-5 md:hidden">{actions(true)}</div>
      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-line sm:grid-cols-4">
        {[[Truck, "Free Delivery", "Across India"], [Lock, "Secure Checkout", "Encrypted"], [RefreshCw, "Easy Returns", "Money return"], [Headphones, "24/7 Support", "Call / WhatsApp"]].map(([I, t, d], k) => {
          const Icon = I as typeof Truck;
          return (
            <div key={k} className="border-line p-3 text-center [&:not(:last-child)]:border-r max-sm:[&:nth-child(2)]:border-r-0 max-sm:[&:nth-child(-n+2)]:border-b">
              <Icon className="mx-auto h-4 w-4 text-teak" />
              <p className="mt-1.5 text-xs font-bold">{t as string}</p>
              <p className="text-[11px] text-muted">{d as string}</p>
            </div>
          );
        })}
      </div>
      {/* mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-line bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
        <div className="mr-auto leading-tight">
          <p className="text-lg font-extrabold">{inr(price)}</p>
          {mrp > price && <p className="text-xs text-muted line-through">{inr(mrp)}</p>}
        </div>
        <button disabled={out} onClick={() => add(item)} className="btn-gold !px-4"><ShoppingCart className="h-4 w-4" /> Add</button>
        <button disabled={out} onClick={() => { add(item, false); router.push("/checkout"); }} className="btn-dark !px-4">Buy Now</button>
      </div>
    </div>
  );
}

const TAB_ICONS: Record<string, typeof Truck> = { desc: FileText, spec: Ruler, ship: Truck, care: Sparkles, reviews: MessageSquareQuote };
export function Tabs({ tabs }: { tabs: { key: string; label: string; content: React.ReactNode }[] }) {
  const [t, setT] = useState(tabs[0]?.key);
  return (
    <div className="card p-5 md:p-8">
      <div className="no-scrollbar -mx-1 flex gap-6 overflow-x-auto border-b border-line px-1">
        {tabs.map((x) => (
          <button key={x.key} onClick={() => setT(x.key)} className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-sm font-semibold transition-colors ${t === x.key ? "border-teak text-teak-dark" : "border-transparent text-muted hover:text-ink"}`}>{(() => { const I = TAB_ICONS[x.key]; return I ? <I className="h-4 w-4" /> : null; })()}{x.label}</button>
        ))}
      </div>
      <div key={t} className="animate-[page-in_.35s_ease] pt-6">{tabs.find((x) => x.key === t)?.content}</div>
    </div>
  );
}

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  if (state === "done") return <p className="rounded-xl bg-[#E8F5EE] p-4 text-sm text-stock">Thank you! Your review will appear once it&apos;s approved.</p>;
  return (
    <form
      className="grid gap-3 rounded-xl bg-cream p-4 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const fd = new FormData(e.currentTarget);
        const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, rating, name: fd.get("name"), city: fd.get("city"), text: fd.get("text") }) });
        const d = await r.json().catch(() => ({}));
        if (r.ok) setState("done"); else { setState("error"); setErr(d.error || "Could not submit review."); }
      }}
    >
      <p className="font-serif text-xl font-semibold md:col-span-2">Write a review</p>
      <div className="flex gap-1 md:col-span-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} stars`} className={`text-2xl ${i <= rating ? "text-teak" : "text-line"}`}>★</button>
        ))}
      </div>
      <input name="name" required placeholder="Your name" className="input" />
      <input name="city" placeholder="City" className="input" />
      <textarea name="text" required minLength={10} rows={3} placeholder="How do you like it? Quality, finish, delivery…" className="input md:col-span-2" />
      {state === "error" && <p className="text-sm text-sale md:col-span-2">{err}</p>}
      <button disabled={state === "sending"} className="btn-gold justify-self-start">Submit review</button>
    </form>
  );
}
