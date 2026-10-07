import { desc } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Badge, Panel } from "@/components/admin/ui";
import { Submit } from "@/components/admin/inputs";
import { deleteMessage, toggleMessageRead } from "@/lib/admin-actions";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Messages" };

export default async function Messages() {
  const rows = await db.select().from(s.contactMessages).orderBy(desc(s.contactMessages.createdAt)).limit(200);
  return (
    <>
      <AdminHeader title="Messages" sub="Contact form submissions." />
      <div className="space-y-3">
        {rows.length === 0 && <Panel><p className="text-center text-sm text-muted">No messages yet.</p></Panel>}
        {rows.map((m) => (
          <div key={m.id} className={`rounded-2xl border bg-white p-4 ${m.read ? "border-line" : "border-teak"}`}>
            <div className="flex flex-wrap items-center gap-2"><b>{m.subject}</b>{!m.read && <Badge v="NEW" label="Unread" />}<span className="ml-auto text-xs text-muted">{fmtDate(m.createdAt, true)}</span></div>
            <p className="mt-1 text-sm"><b>{m.name}</b> · <a href={`tel:${m.phone}`} className="underline">{m.phone}</a> · <a href={`mailto:${m.email}`} className="underline">{m.email}</a></p>
            <p className="mt-2 whitespace-pre-line text-sm text-muted">{m.message}</p>
            <div className="mt-3 flex gap-2">
              <form action={toggleMessageRead}><input type="hidden" name="id" value={m.id} /><Submit className="btn-outline btn-sm">{m.read ? "Mark unread" : "Mark read"}</Submit></form>
              <form action={deleteMessage}><input type="hidden" name="id" value={m.id} /><Submit className="btn-outline btn-sm !text-sale" confirm="Delete message?">Delete</Submit></form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
