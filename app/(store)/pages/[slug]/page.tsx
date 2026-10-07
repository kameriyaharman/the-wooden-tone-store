import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { PageHero, Paragraphs } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await db.query.pages.findFirst({ where: eq(s.pages.slug, slug) });
  if (!p) notFound();
  return (
    <>
      <PageHero eyebrow={`Last updated ${fmtDate(p.updatedAt)}`} title={p.title} crumbs={[{ href: "/", label: "Home" }, { label: p.title }]} />
      <div className="container-site max-w-3xl py-12"><Paragraphs text={p.content} className="text-[15px] text-ink/80" /></div>
    </>
  );
}
