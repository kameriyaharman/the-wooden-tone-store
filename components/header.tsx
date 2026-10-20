"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Heart, Menu, Search, ShoppingBag, Truck, User, X, ArrowRight } from "lucide-react";
import { useStore } from "./store-provider";
import { WhatsappIcon } from "./icons";
import type { NavRoom } from "@/lib/catalog";
import { inr } from "@/lib/format";

type Props = { rooms: NavRoom[]; storeName: string; tagline: string; whatsapp: string; loggedIn: boolean };

const NAV = [
  { href: "/shop?sort=new", label: "New In" },
  { href: "/shop?sort=featured", label: "Best Sellers" },
  { href: "/shop?sort=discount", label: "Offers" },
  { href: "/custom-order", label: "Custom Order" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export function Logo({ compact = false, storeName, tagline }: { compact?: boolean; storeName: string; tagline: string }) {
  return (
    <Link href="/" className="flex flex-col items-center rounded-md text-center outline-none focus-visible:ring-2 focus-visible:ring-teak/40" aria-label={storeName}>
      {compact ? (
        <span className="flex items-center gap-2">
          <img src="/seed/logo.png" alt="" className="h-7 w-auto shrink-0" />
          <span className="whitespace-nowrap font-serif text-[15px] font-semibold uppercase tracking-[0.1em] text-ink min-[400px]:text-[17px]">{storeName}</span>
        </span>
      ) : (
        <>
          <img src="/seed/logo.png" alt="" className="h-10 w-auto transition-all duration-300 group-data-[scrolled]/hdr:h-8" />
          <span className="mt-1 whitespace-nowrap font-serif text-[24px] font-semibold uppercase leading-none tracking-[0.2em] text-ink transition-all duration-300 group-data-[scrolled]/hdr:text-[20px]">{storeName}</span>
          <span className="mt-1.5 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.42em] text-teak transition-all duration-300 group-data-[scrolled]/hdr:hidden">{tagline}</span>
        </>
      )}
    </Link>
  );
}

/** Rotating one-line announcement strip (Gharana-style top bar). */
export function AnnouncementBar({ items }: { items: string[] }) {
  const [i, setI] = useState(0);
  const n = items.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 3500);
    return () => clearInterval(t);
  }, [n]);
  if (!n) return null;
  return (
    <div className="bg-ink text-white">
      <div className="container-site flex h-9 items-center justify-center">
        <p key={i} className="animate-ann-in truncate text-center text-[11px] font-medium uppercase tracking-[0.22em]">{items[i]}</p>
      </div>
    </div>
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
        window.dispatchEvent(new Event("twt:navstart"));
        router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search furniture, décor…"
        className="w-full border-b border-line bg-transparent py-2 pl-7 pr-2 text-[13px] tracking-wide outline-none transition placeholder:text-muted focus:border-teak"
        aria-label="Search products"
      />
      {open && res.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 min-w-[300px] overflow-hidden border border-line bg-white shadow-card">
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
    <div className="absolute left-1/2 top-full z-50 w-[min(1100px,calc(100vw-32px))] -translate-x-1/2 border border-line bg-white p-6 shadow-2xl">
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
                  className={`flex items-center justify-between px-3 py-2 text-[13px] uppercase tracking-[0.1em] ${i === active ? "bg-ink text-white" : "text-ink hover:bg-cream"}`}
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
                <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={onClose} className="border border-line px-3 py-1 text-ink hover:border-teak hover:text-teak-dark">
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="bg-cream p-3">
          <img src={room.image || room.categories[0]?.image || "/seed/banners/hero-sofa.jpg"} alt="" className="h-40 w-full object-cover" />
          <p className="mt-3 font-serif text-2xl font-medium">{room.name} Edit</p>
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
            <img src="/seed/logo.png" alt="" className="h-9" />
            <span className="font-serif text-lg font-semibold uppercase tracking-[0.12em]">{storeName}</span>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="p-1"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4"><SearchBox onDone={onClose} /></div>
        <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Popular categories</p>
        <div className="grid grid-cols-3 gap-2.5 p-4">
          {popular.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={onClose} className="text-center">
              <img src={c.image!} alt="" className="arch aspect-[4/5] w-full object-cover" />
              <span className="mt-1 block text-xs">{c.name}</span>
            </Link>
          ))}
        </div>
        <nav className="border-t border-line">
          {[{ href: "/", label: "Home" }, { href: "/categories", label: "Shop by Category" }, { href: "/shop", label: "Shop All" }, { href: "/custom-order", label: "Custom Order" }, { href: "/about", label: "About Us" }, { href: "/contact", label: "Contact" }, { href: "/track-order", label: "Track Order" }, { href: "/wishlist", label: "Wishlist" }, { href: "/account", label: "My Account" }].map((l) => (
            <Link key={l.href} href={l.href} onClick={onClose} className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em]">
              {l.label} <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </nav>
        <div className="m-4 bg-cream p-4">
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
  const [scrolled, setScrolled] = useState(false);
  const closeT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMega(false); setMobile(false); setMSearch(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const link = (on: boolean) =>
    `nav-link whitespace-nowrap px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.16em] transition ${on ? "text-teak-dark" : "text-ink hover:text-teak-dark"}`;
  const icon = "relative p-2 transition hover:text-teak-dark";
  const badge = "badge-pop absolute right-0 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-teak px-1 text-[9px] font-semibold text-white";

  return (
    <header data-scrolled={scrolled || undefined} className="group/hdr sticky top-0 z-50 border-b border-line bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/90">
      <div className={`container-site grid grid-cols-[1fr_auto_1fr] items-center gap-3 transition-all duration-300 ${scrolled ? "h-[60px] lg:h-[70px]" : "h-[64px] lg:h-[96px]"}`}>
        {/* left */}
        <div className="flex items-center">
          <button className="-ml-1 p-1 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
          <div className="hidden w-60 lg:block"><SearchBox /></div>
        </div>

        {/* centre logo */}
        <div className="lg:hidden"><Logo compact storeName={storeName} tagline={tagline} /></div>
        <div className="hidden lg:block"><Logo storeName={storeName} tagline={tagline} /></div>

        {/* right */}
        <div className="flex items-center justify-end gap-0.5">
          <button className={`${icon} lg:hidden`} aria-label="Search" onClick={() => setMSearch((v) => !v)}><Search className="h-5 w-5" strokeWidth={1.5} /></button>
          <Link href="/track-order" className={`${icon} hidden lg:block`} aria-label="Track order" title="Track order"><Truck className="h-5 w-5" strokeWidth={1.5} /></Link>
          <Link href={loggedIn ? "/account" : "/login"} className={`${icon} hidden lg:block`} aria-label="Account" title={loggedIn ? "My account" : "Sign in"}><User className="h-5 w-5" strokeWidth={1.5} /></Link>
          <Link href="/wishlist" className={`${icon} hidden lg:block`} aria-label="Wishlist" title="Wishlist">
            <Heart className="h-5 w-5" strokeWidth={1.5} />
            {ready && wishlist.length > 0 && <span key={wishlist.length} className={badge}>{wishlist.length}</span>}
          </Link>
          <button onClick={() => setDrawer(true)} className={icon} aria-label={`Cart, ${count} items`} title="Cart">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
            {ready && count > 0 && <span key={count} className={badge}>{count}</span>}
          </button>
        </div>
      </div>

      {/* centred nav row */}
      <nav className="relative hidden h-12 items-center justify-center gap-1 border-t border-line lg:flex">
        <Link href="/" className={link(isActive("/"))}>Home</Link>
        <div
          onMouseEnter={() => { if (closeT.current) clearTimeout(closeT.current); setMega(true); }}
          onMouseLeave={() => { closeT.current = setTimeout(() => setMega(false), 150); }}
          className="static flex h-full items-center"
        >
          <button onClick={() => setMega((v) => !v)} className={`${link(mega || pathname.startsWith("/categories") || pathname.startsWith("/shop"))} flex items-center gap-1`} aria-expanded={mega}>
            Shop <ChevronDown className="h-3 w-3" />
          </button>
          {mega && <MegaMenu rooms={rooms} onClose={() => setMega(false)} />}
        </div>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={link(n.href.startsWith("/shop") ? false : isActive(n.href))}>{n.label}</Link>
        ))}
      </nav>

      {mSearch && <div className="container-site pb-3 lg:hidden"><SearchBox autoFocus onDone={() => setMSearch(false)} /></div>}
      {mobile && <MobileMenu rooms={rooms} onClose={() => setMobile(false)} whatsapp={whatsapp} storeName={storeName} tagline={tagline} />}
    </header>
  );
}
