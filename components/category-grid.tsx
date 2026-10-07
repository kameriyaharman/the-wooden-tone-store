"use client";
import Link from "next/link";
import { useState } from "react";

export function CategoryGrid({ cats }: { cats: { slug: string; name: string; image: string | null }[] }) {
  const letters = [...new Set(cats.map((c) => c.name[0].toUpperCase()))].sort();
  const [l, setL] = useState("All");
  const shown = l === "All" ? cats : cats.filter((c) => c.name[0].toUpperCase() === l);
  return (
    <>
      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {["All", ...letters].map((x) => (
          <button key={x} onClick={() => setL(x)} className={`grid h-9 min-w-9 shrink-0 place-items-center rounded-full border px-3 text-xs font-semibold ${l === x ? "border-ink bg-ink text-white" : "border-line hover:border-teak"}`}>{x}</button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 md:gap-4">
        {shown.map((c) => (
          <Link key={c.slug} href={`/shop?category=${c.slug}`} className="card group p-2 text-center transition hover:border-teak hover:shadow-card">
            <div className="overflow-hidden rounded-xl bg-cream">
              {c.image ? <img src={c.image} alt="" loading="lazy" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="aspect-square" />}
            </div>
            <p className="mt-2 pb-1 text-[12px] font-medium leading-tight md:text-[13px]">{c.name}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
