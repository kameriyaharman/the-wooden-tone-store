import Link from "next/link";
import { ArrowRight, ChevronRight, Home, Leaf } from "lucide-react";

export function SectionHead({ eyebrow, title, href, linkLabel = "View All", center = false, sub }: { eyebrow?: string; title: string; href?: string; linkLabel?: string; center?: boolean; sub?: string }) {
  if (center)
    return (
      <div className="text-center">
        {eyebrow && <span className="chip">{eyebrow}</span>}
        <h2 className="h-display mt-3 text-[34px] md:text-[44px]">{title}</h2>
        {sub && <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{sub}</p>}
      </div>
    );
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-teak"><Leaf className="h-3 w-3" />{eyebrow}</p>}
        <h2 className="h-display mt-1.5 text-[30px] md:text-[38px]">{title}</h2>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {href && <Link href={href} className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-teak-dark hover:underline">{linkLabel} <ArrowRight className="h-3.5 w-3.5" /></Link>}
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
      <div className="container-site py-10 md:py-14">
        <Breadcrumbs items={crumbs} />
        <p className="eyebrow mt-4">{eyebrow}</p>
        <h1 className="h-display mt-2 text-[40px] md:text-[56px]">{title}</h1>
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
