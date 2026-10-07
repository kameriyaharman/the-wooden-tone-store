"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpDown, ChevronUp, Filter, LayoutGrid, List, Star, X } from "lucide-react";

type Cat = { slug: string; name: string; n: number };

function useQS() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const set = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v === null || v === "" ? q.delete(k) : q.set(k, v));
    if (!("page" in patch)) q.delete("page");
    router.push(`${pathname}?${q.toString()}`, { scroll: false });
  };
  return { sp, set };
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-t border-line py-5 first:border-t-0 first:pt-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-sm font-bold">
        {title} <ChevronUp className={`h-4 w-4 transition ${open ? "" : "rotate-180"}`} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function FilterPanel({ cats, woods, onApplied }: { cats: Cat[]; woods: string[]; onApplied?: () => void }) {
  const { sp, set } = useQS();
  const [min, setMin] = useState(sp.get("min") || "0");
  const [max, setMax] = useState(sp.get("max") || "100000");
  useEffect(() => { setMin(sp.get("min") || "0"); setMax(sp.get("max") || "100000"); }, [sp]);
  const selCats = (sp.get("category") || "").split(",").filter(Boolean);
  const selWood = (sp.get("wood") || "").split(",").filter(Boolean);
  const toggle = (key: "category" | "wood", cur: string[], v: string) => {
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    set({ [key]: next.join(",") || null });
  };
  const [showAll, setShowAll] = useState(false);
  const visibleCats = showAll ? cats : cats.filter((c) => c.n > 0 || selCats.includes(c.slug)).slice(0, 12);
  const box = "h-4 w-4 rounded border-line accent-[#C4841D]";
  return (
    <div>
      <Group title="Price Range">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-muted">Min (₹)<input className="input mt-1 !py-2" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} /></label>
          <label className="text-[11px] text-muted">Max (₹)<input className="input mt-1 !py-2" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} /></label>
        </div>
        <input type="range" min={0} max={200000} step={1000} value={Number(max) || 0} onChange={(e) => setMax(e.target.value)} className="mt-3 w-full accent-[#C4841D]" aria-label="Maximum price" />
        <button onClick={() => { set({ min: min === "0" ? null : min, max: max || null }); onApplied?.(); }} className="btn-outline btn-sm mt-2 w-full">Apply Price Filter</button>
      </Group>
      <Group title="Category">
        <ul className="space-y-2.5">
          {visibleCats.map((c) => (
            <li key={c.slug}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input type="checkbox" className={box} checked={selCats.includes(c.slug)} onChange={() => toggle("category", selCats, c.slug)} />
                <span className="flex-1">{c.name}</span><span className="text-xs text-muted">{c.n}</span>
              </label>
            </li>
          ))}
        </ul>
        {cats.length > visibleCats.length && !showAll && <button onClick={() => setShowAll(true)} className="mt-3 text-xs font-semibold text-teak-dark">Show all {cats.length} categories</button>}
      </Group>
      {woods.length > 0 && (
        <Group title="Wood Type">
          <ul className="space-y-2.5">
            {woods.map((w) => (
              <li key={w}><label className="flex cursor-pointer items-center gap-2.5 text-[13px]"><input type="checkbox" className={box} checked={selWood.includes(w)} onChange={() => toggle("wood", selWood, w)} />{w}</label></li>
            ))}
          </ul>
        </Group>
      )}
      <Group title="Discount">
        <ul className="space-y-2.5">
          {["50", "30", "10"].map((d) => (
            <li key={d}><label className="flex cursor-pointer items-center gap-2.5 text-[13px]"><input type="radio" name="disc" className="h-4 w-4 accent-[#C4841D]" checked={sp.get("discount") === d} onChange={() => set({ discount: d })} />{d}% or more</label></li>
          ))}
          {sp.get("discount") && <li><button className="text-xs text-teak-dark" onClick={() => set({ discount: null })}>Clear</button></li>}
        </ul>
      </Group>
      <Group title="Customer Rating">
        <ul className="space-y-2.5">
          {["4", "3", "2"].map((r) => (
            <li key={r}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input type="radio" name="rating" className="h-4 w-4 accent-[#C4841D]" checked={sp.get("rating") === r} onChange={() => set({ rating: r })} />
                <span className="flex">{Array.from({ length: +r }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-teak text-teak" />)}</span> &amp; above
              </label>
            </li>
          ))}
        </ul>
      </Group>
    </div>
  );
}

export function SortSelect() {
  const { sp, set } = useQS();
  return (
    <select value={sp.get("sort") || "featured"} onChange={(e) => set({ sort: e.target.value === "featured" ? null : e.target.value })} className="input !w-auto !py-2 pr-8 text-[13px]" aria-label="Sort products">
      <option value="featured">Sort by: Featured</option>
      <option value="new">Newest first</option>
      <option value="price-asc">Price: Low to High</option>
      <option value="price-desc">Price: High to Low</option>
      <option value="discount">Biggest discount</option>
    </select>
  );
}

export function ViewToggle() {
  const { sp, set } = useQS();
  const list = sp.get("view") === "list";
  return (
    <div className="flex overflow-hidden rounded-lg border border-line">
      <button aria-label="Grid view" onClick={() => set({ view: null, page: sp.get("page") })} className={`grid h-9 w-9 place-items-center ${!list ? "bg-tint text-teak-dark" : ""}`}><LayoutGrid className="h-4 w-4" /></button>
      <button aria-label="List view" onClick={() => set({ view: "list", page: sp.get("page") })} className={`grid h-9 w-9 place-items-center ${list ? "bg-tint text-teak-dark" : ""}`}><List className="h-4 w-4" /></button>
    </div>
  );
}

export function ActiveChips({ catNames }: { catNames: Record<string, string> }) {
  const { sp, set } = useQS();
  const chips: { label: string; clear: Record<string, string | null> }[] = [];
  const cats = (sp.get("category") || "").split(",").filter(Boolean);
  cats.forEach((c) => chips.push({ label: catNames[c] || c, clear: { category: cats.filter((x) => x !== c).join(",") || null } }));
  const woods = (sp.get("wood") || "").split(",").filter(Boolean);
  woods.forEach((w) => chips.push({ label: w, clear: { wood: woods.filter((x) => x !== w).join(",") || null } }));
  if (sp.get("min") || sp.get("max")) chips.push({ label: `₹${Number(sp.get("min") || 0).toLocaleString("en-IN")} – ₹${Number(sp.get("max") || 0).toLocaleString("en-IN") || "∞"}`, clear: { min: null, max: null } });
  if (sp.get("discount")) chips.push({ label: `${sp.get("discount")}%+ off`, clear: { discount: null } });
  if (sp.get("rating")) chips.push({ label: `${sp.get("rating")}★ & above`, clear: { rating: null } });
  if (sp.get("q")) chips.push({ label: `“${sp.get("q")}”`, clear: { q: null } });
  if (sp.get("room")) chips.push({ label: sp.get("room")!.replace(/-/g, " "), clear: { room: null } });
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c, i) => (
        <button key={i} onClick={() => set(c.clear)} className="flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1.5 text-xs capitalize hover:border-teak">
          {c.label} <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  );
}

export function ClearAll() {
  const router = useRouter();
  const pathname = usePathname();
  return <button onClick={() => router.push(pathname)} className="text-xs font-semibold text-teak-dark">Clear all</button>;
}

export function MobileFilterBar({ cats, woods, count }: { cats: Cat[]; woods: string[]; count: number }) {
  const [open, setOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const { set, sp } = useQS();
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; }, [open]);
  return (
    <div className="lg:hidden">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setOpen(true)} className="btn-outline !py-2.5"><Filter className="h-4 w-4" /> Filters{count ? ` (${count})` : ""}</button>
        <button onClick={() => setSortOpen(true)} className="btn-outline !py-2.5"><ArrowUpDown className="h-4 w-4" /> Sort</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-[65] flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-serif text-2xl font-semibold">Filters</p>
            <button onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4"><FilterPanel cats={cats} woods={woods} /></div>
          <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
            <ClearAll />
            <button onClick={() => setOpen(false)} className="btn-gold">Show results</button>
          </div>
        </div>
      )}
      {sortOpen && (
        <div className="fixed inset-0 z-[65]" onClick={() => setSortOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 font-serif text-xl font-semibold">Sort by</p>
            {[["featured", "Featured"], ["new", "Newest first"], ["price-asc", "Price: Low to High"], ["price-desc", "Price: High to Low"], ["discount", "Biggest discount"]].map(([v, l]) => (
              <button key={v} onClick={() => { set({ sort: v === "featured" ? null : v }); setSortOpen(false); }} className={`block w-full border-b border-line py-3 text-left text-sm ${(sp.get("sort") || "featured") === v ? "font-bold text-teak-dark" : ""}`}>{l}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
