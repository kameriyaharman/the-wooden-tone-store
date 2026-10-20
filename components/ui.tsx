import Link from "next/link";
import { ArrowRight, ChevronRight, Home } from "lucide-react";

export function SectionHead({ eyebrow, title, href, linkLabel = "View All", center = false, sub }: { eyebrow?: string; title: string; href?: string; linkLabel?: string; center?: boolean; sub?: string }) {
  if (center)
    return (
      <div className="text-center">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="h-section mt-2">{title}</h2>
        <span className="ornament" aria-hidden><span className="text-[10px]">✦</span></span>
        {sub && <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted">{sub}</p>}
      </div>
    );
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="h-section mt-1.5">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {href && <Link href={href} className="flex shrink-0 items-center gap-1.5 border-b border-ink pb-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink hover:border-teak hover:text-teak-dark">{linkLabel} <ArrowRight className="h-3.5 w-3.5" /></Link>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {it.href ? <Link href={it.href} className="flex items-center gap-1 hover:text-ink">{i === 0 && <Home className="h-3.5 w-3.5" />}{it.label}</Link> : <span className="font-medium text-ink">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageHero({ eyebrow, title, sub, crumbs }: { eyebrow: string; title: string; sub?: string; crumbs: { href?: string; label: string }[] }) {
  return (
    <section className="border-b border-line bg-cream">
      <div className="container-site flex flex-col items-center py-10 text-center md:py-14">
        <Breadcrumbs items={crumbs} />
        <p className="eyebrow mt-5">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-[34px] font-medium uppercase leading-tight tracking-[0.08em] md:text-[48px]">{title}</h1>
        <span className="ornament" aria-hidden><span className="text-[10px]">✦</span></span>
        {sub && <p className="mt-3 max-w-xl text-[15px] text-muted">{sub}</p>}
      </div>
    </section>
  );
}

export function Paragraphs({ text, className = "" }: { text?: string | null; className?: string }) {
  if (!text) return null;
  return (
    <div className={className}>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="mb-3 whitespace-pre-line leading-relaxed">{p}</p>
      ))}
    </div>
  );
}
