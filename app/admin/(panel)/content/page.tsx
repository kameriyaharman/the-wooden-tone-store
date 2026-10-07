import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Check, Field, Flash } from "@/components/admin/ui";
import { Submit } from "@/components/admin/inputs";
import { deleteFaq, saveFaq, savePage } from "@/lib/admin-actions";

export const metadata = { title: "FAQ & Pages" };

export default async function Content({ searchParams }: { searchParams: Promise<{ tab?: string; saved?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "pages" ? "pages" : "faq";
  const [faqs, pages] = await Promise.all([db.select().from(s.faqs).orderBy(asc(s.faqs.sortOrder)), db.select().from(s.pages).orderBy(asc(s.pages.title))]);
  return (
    <>
      <AdminHeader title="FAQ & Pages" sub="Homepage FAQ and policy pages (privacy, terms, refunds…)." />
      <Flash show={sp.saved} />
      <div className="mb-5 flex gap-2">
        <Link href="/admin/content" className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === "faq" ? "bg-ink text-white" : "bg-white ring-1 ring-line"}`}>FAQ ({faqs.length})</Link>
        <Link href="/admin/content?tab=pages" className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === "pages" ? "bg-ink text-white" : "bg-white ring-1 ring-line"}`}>Pages ({pages.length})</Link>
      </div>
      {tab === "faq" ? (
        <div className="space-y-3">
          {[...faqs, null].map((f) => (
            <details key={f?.id || "new"} className={`rounded-2xl border bg-white ${f ? "border-line" : "border-dashed border-teak"}`} open={!f && faqs.length === 0}>
              <summary className="cursor-pointer p-4 text-sm font-semibold">{f ? f.question : <span className="text-teak-dark">+ Add question</span>}{f && !f.active && <span className="ml-2 text-xs text-muted">(hidden)</span>}</summary>
              <div className="border-t border-line p-4">
                <form action={saveFaq} className="grid gap-3">
                  {f && <input type="hidden" name="id" value={f.id} />}
                  <Field label="Question"><input name="question" required defaultValue={f?.question} className="input" /></Field>
                  <Field label="Answer"><textarea name="answer" required rows={3} defaultValue={f?.answer} className="input" /></Field>
                  <div className="flex items-center gap-4"><Field label="Order"><input name="sortOrder" type="number" defaultValue={f?.sortOrder ?? faqs.length} className="input !w-24" /></Field><Check name="active" label="Visible" defaultChecked={f ? f.active : true} /><Submit className="btn-gold btn-sm ml-auto">Save</Submit></div>
                </form>
                {f && <form action={deleteFaq} className="mt-2"><input type="hidden" name="id" value={f.id} /><Submit className="text-xs text-sale" confirm="Delete question?">Delete</Submit></form>}
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {[...pages, null].map((p) => (
            <details key={p?.id || "new"} className={`rounded-2xl border bg-white ${p ? "border-line" : "border-dashed border-teak"}`}>
              <summary className="cursor-pointer p-4 text-sm font-semibold">{p ? <>{p.title} <span className="font-normal text-muted">/pages/{p.slug}</span></> : <span className="text-teak-dark">+ Add page</span>}</summary>
              <form action={savePage} className="grid gap-3 border-t border-line p-4">
                {p && <input type="hidden" name="id" value={p.id} />}
                <div className="grid gap-3 md:grid-cols-2"><Field label="Title"><input name="title" required defaultValue={p?.title} className="input" /></Field><Field label="Slug"><input name="slug" defaultValue={p?.slug} className="input" /></Field></div>
                <Field label="Content" hint="Leave a blank line between paragraphs."><textarea name="content" rows={10} defaultValue={p?.content} className="input font-mono text-[13px]" /></Field>
                <div><Submit className="btn-gold btn-sm">Save page</Submit></div>
              </form>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
