"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Heart, LayoutGrid, Menu, Search, ShoppingCart, Truck, User, X, ArrowRight } from "lucide-react";
import { useStore } from "./store-provider";
import { WhatsappIcon } from "./icons";
import type { NavRoom } from "@/lib/catalog";
import { inr } from "@/lib/format";

type Props = { rooms: NavRoom[]; storeName: string; tagline: string; whatsapp: string; loggedIn: boolean };

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/custom-order", label: "Custom Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Logo({ compact = false, storeName, tagline }: { compact?: boolean; storeName: string; tagline: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={storeName}>
      <img src="/seed/logo.jpg" alt="" className={compact ? "h-9 w-auto" : "h-11 w-auto"} />
      {!compact && (
        <span className="hidden whitespace-nowrap leading-none sm:block">
          <span className="block font-serif text-[22px] font-semibold text-ink">{storeName}</span>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.3em] text-muted">{tagline}</span>
        </span>
      )}
    </Link>
  );
}

function SearchBox({ onDone, autoFocus }: { onDone?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ name: string; slug: string; price: number; image: string | null }[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (q.trim().length < 2) return setRes([]);
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d) => setRes(d.items || []))
        .catch(() => {});
    }, 200);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);
  return (
    <form
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (!q.trim()) return;
        setOpen(false);
        onDone?.();
        router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search furniture, decor…"
        className="w-full rounded-lg border border-[#EADFCB] bg-cream py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teak"
        aria-label="Search products"
      />
      {open && res.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-card">
          {res.map((p) => (
            <Link key={p.slug} href={`/product/${p.slug}`} onClick={() => onDone?.()} className="flex items-center gap-3 px-3 py-2 hover:bg-cream">
              {p.image && <img src={p.image} alt="" className="h-10 w-10 rounded-md object-cover" />}
              <span className="line-clamp-1 flex-1 text-sm">{p.name}</span>
              <span className="text-sm font-semibold">{inr(p.price)}</span>
            </Link>
          ))}
          <button className="w-full border-t border-line px-3 py-2 text-left text-xs font-semibold text-teak-dark">See all results →</button>
        </div>
      )}
    </form>
  );
}

function MegaMenu({ rooms, onClose }: { rooms: NavRoom[]; onClose: () => void }) {
  const [active, setActive] = useState(0);
  const room = rooms[active];
  if (!room) return null;
  return (
    <div className="absolute left-1/2 top-full z-50 mt-2 w-[min(1100px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-line bg-white p-5 shadow-2xl">
      <div className="grid grid-cols-[200px_1fr_240px] gap-6">
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Shop by room</p>
          <ul className="space-y-1">
            {rooms.map((r, i) => (
              <li key={r.slug}>
                <Link
                  href={`/shop?room=${r.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${i === active ? "bg-ink text-white" : "text-ink hover:bg-cream"}`}
                >
                  {r.name} <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/categories" onClick={onClose} className="mt-4 flex items-center justify-between px-3 text-sm font-semibold text-teak-dark">
            Browse all categories <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{room.name} categories</p>
          <div className="grid grid-cols-3 gap-x-6">
            {room.categories.map((c) => (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={onClose} className="border-b border-line py-2 text-sm text-ink hover:text-teak-dark">
                {c.name}
              </Link>
            ))}
          </div>
          {room.categories.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-xs text-muted">
              Trending in {room.name}
              {room.categories.slice(0, 4).map((c) => (
                <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={onClose} className="rounded-full bg-cream px-3 py-1 text-ink hover:bg-tint">
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl bg-cream p-3">
          <img src={room.image || room.categories[0]?.image || "/seed/banners/hero-sofa.jpg"} alt="" className="h-36 w-full rounded-lg object-cover" />
          <p className="mt-3 font-serif text-xl font-semibold">{room.name} Edit</p>
          <p className="mt-1 text-xs text-muted">{room.description}</p>
          <Link href={`/shop?room=${room.slug}`} onClick={onClose} className="btn-outline btn-sm mt-3">
            Shop section <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ rooms, onClose, whatsapp, storeName, tagline }: { rooms: NavRoom[]; onClose: () => void; whatsapp: string; storeName: string; tagline: string }) {
  const popular = rooms.flatMap((r) => r.categories).filter((c) => c.image).slice(0, 9);
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 flex h-full w-[86%] max-w-[360px] flex-col overflow-y-auto bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/seed/logo.jpg" alt="" className="h-9" />
            <span className="font-serif text-lg font-semibold">{storeName}</span>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="p-1"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4"><SearchBox onDone={onClose} /></div>
        <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Popular categories</p>
        <div className="grid grid-cols-3 gap-2.5 p-4">
          {popular.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={onClose} className="text-center">
              <img src={c.image!} alt="" className="aspect-square w-full rounded-xl object-cover" />
              <span className="mt-1 block text-xs">{c.name}</span>
            </Link>
          ))}
        </div>
        <nav className="border-t border-line">
          {[{ href: "/", label: "Home" }, { href: "/categories", label: "Shop by Category" }, { href: "/shop", label: "Shop All" }, { href: "/custom-order", label: "Custom Order" }, { href: "/about", label: "About Us" }, { href: "/contact", label: "Contact" }, { href: "/track-order", label: "Track Order" }, { href: "/wishlist", label: "Wishlist" }, { href: "/account", label: "My Account" }].map((l) => (
            <Link key={l.href} href={l.href} onClick={onClose} className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[15px] font-medium">
              {l.label} <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </nav>
        <div className="m-4 rounded-xl bg-cream p-4">
          <p className="text-sm font-semibold">Need help choosing?</p>
          <p className="mt-1 text-xs text-muted">Chat with us on WhatsApp for sizes, finishes and custom work.</p>
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="btn-gold btn-sm mt-3"><WhatsappIcon className="h-4 w-4" /> Chat on WhatsApp</a>
        </div>
        <p className="sr-only">{tagline}</p>
      </aside>
    </div>
  );
}

export function Header({ rooms, storeName, tagline, whatsapp, loggedIn }: Props) {
  const pathname = usePathname();
  const { count, setDrawer, wishlist, ready } = useStore();
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [mSearch, setMSearch] = useState(false);
  const closeT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMega(false); setMobile(false); setMSearch(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const pill = (on: boolean) => `whitespace-nowrap rounded-md px-3 py-1.5 text-[14px] transition ${on ? "bg-tint text-teak-dark" : "text-ink hover:text-teak-dark"}`;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <div className="container-site flex h-[68px] items-center gap-4 lg:h-[76px]">
        <button className="-ml-1 p-1 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
        <div className="lg:hidden"><Logo compact storeName={storeName} tagline={tagline} /></div>
        <div className="hidden lg:block"><Logo storeName={storeName} tagline={tagline} /></div>

        <nav className="relative ml-4 hidden items-center gap-0.5 lg:flex">
          <Link href="/" className={pill(isActive("/") && pathname === "/")}>Home</Link>
          <div
            onMouseEnter={() => { if (closeT.current) clearTimeout(closeT.current); setMega(true); }}
            onMouseLeave={() => { closeT.current = setTimeout(() => setMega(false), 150); }}
            className="static"
          >
            <button onClick={() => setMega((v) => !v)} className={`${pill(mega || pathname.startsWith("/categories"))} flex items-center gap-1.5`} aria-expanded={mega}>
              <LayoutGrid className="h-4 w-4" /> Categories <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {mega && <MegaMenu rooms={rooms} onClose={() => setMega(false)} />}
          </div>
          {NAV.slice(1).map((n) => (
            <Link key={n.href} href={n.href} className={pill(isActive(n.href))}>{n.label}</Link>
          ))}
        </nav>

        <div className="ml-auto hidden w-52 xl:block"><SearchBox /></div>
        <div className="ml-auto flex items-center gap-1 xl:ml-2">
          <button className="p-2 xl:hidden" aria-label="Search" onClick={() => setMSearch((v) => !v)}><Search className="h-5 w-5" /></button>
          <Link href="/track-order" className="hidden p-2 hover:text-teak-dark lg:block" aria-label="Track order" title="Track order"><Truck className="h-5 w-5" /></Link>
          <Link href="/wishlist" className="relative hidden p-2 hover:text-teak-dark lg:block" aria-label="Wishlist">
            <Heart className="h-5 w-5" />
            {ready && wishlist.length > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-teak px-1 text-[10px] font-bold text-white">{wishlist.length}</span>}
          </Link>
          <button onClick={() => setDrawer(true)} className="relative p-2 hover:text-teak-dark" aria-label={`Cart, ${count} items`}>
            <ShoppingCart className="h-5 w-5" />
            {ready && count > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-teak px-1 text-[10px] font-bold text-white">{count}</span>}
          </button>
          <Link href={loggedIn ? "/account" : "/login"} className="hidden p-2 hover:text-teak-dark lg:block" aria-label="Account"><User className="h-5 w-5" /></Link>
        </div>
      </div>
      {mSearch && <div className="container-site pb-3 xl:hidden"><SearchBox autoFocus onDone={() => setMSearch(false)} /></div>}
      {mobile && <MobileMenu rooms={rooms} onClose={() => setMobile(false)} whatsapp={whatsapp} storeName={storeName} tagline={tagline} />}
    </header>
  );
}
