import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";
import { AdminHeader, Check, Field, Flash } from "@/components/admin/ui";
import { ImageList, Submit } from "@/components/admin/inputs";
import { deleteCategory, deleteRoom, saveCategory, saveRoom } from "@/lib/admin-actions";

export const metadata = { title: "Categories" };

export default async function Categories({ searchParams }: { searchParams: Promise<{ tab?: string; saved?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === "rooms" ? "rooms" : "cats";
  const [cats, rooms] = await Promise.all([
    db.select({ c: s.categories, n: sql<number>`(select count(*)::int from ${s.products} p where p.category_id = "categories"."id")` }).from(s.categories).orderBy(asc(s.categories.name)),
    db.select().from(s.rooms).orderBy(asc(s.rooms.sortOrder)),
  ]);
  const roomName = Object.fromEntries(rooms.map((r) => [r.id, r.name]));
  return (
    <>
      <AdminHeader title="Categories" sub="Categories group products; rooms group categories in the menu and on the Categories page." />
      <Flash show={sp.saved} />
      <div className="mb-5 flex gap-2">
        <Link href="/admin/categories" className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === "cats" ? "bg-ink text-white" : "bg-white ring-1 ring-line"}`}>Categories ({cats.length})</Link>
        <Link href="/admin/categories?tab=rooms" className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === "rooms" ? "bg-ink text-white" : "bg-white ring-1 ring-line"}`}>Rooms ({rooms.length})</Link>
      </div>
      {tab === "cats" ? (
        <div className="space-y-3">
          <details className="rounded-2xl border border-dashed border-teak bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-teak-dark">+ Add category</summary>
            <CatForm rooms={rooms} />
          </details>
          {cats.map(({ c, n }) => (
            <details key={c.id} className="rounded-2xl border border-line bg-white">
              <summary className="flex cursor-pointer items-center gap-3 p-3">
                {c.image ? <img src={c.image} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <div className="h-11 w-11 rounded-lg bg-cream" />}
                <span className="flex-1"><b className="text-sm">{c.name}</b><span className="block text-xs text-muted">{c.roomId ? roomName[c.roomId] : "No room"} · {n} products{c.featured ? " · On home" : ""}{c.active ? "" : " · Hidden"}</span></span>
                <span className="text-xs font-semibold text-teak-dark">Edit</span>
              </summary>
              <div className="border-t border-line p-4">
                <CatForm rooms={rooms} c={c} />
                <form action={deleteCategory} className="mt-3"><input type="hidden" name="id" value={c.id} /><Submit className="text-xs font-semibold text-sale" confirm={`Delete "${c.name}"? Its products will stay but lose this category.`}>Delete category</Submit></form>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <details className="rounded-2xl border border-dashed border-teak bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-teak-dark">+ Add room</summary>
            <RoomForm />
          </details>
          {rooms.map((r) => (
            <details key={r.id} className="rounded-2xl border border-line bg-white">
              <summary className="flex cursor-pointer items-center gap-3 p-3">
                {r.image ? <img src={r.image} alt="" className="h-11 w-16 rounded-lg object-cover" /> : <div className="h-11 w-16 rounded-lg bg-cream" />}
                <span className="flex-1"><b className="text-sm">{r.name}</b><span className="block text-xs text-muted">{r.description}{r.showOnHome ? " · Shown as big tile" : ""}</span></span>
                <span className="text-xs font-semibold text-teak-dark">Edit</span>
              </summary>
              <div className="border-t border-line p-4">
                <RoomForm r={r} />
                <form action={deleteRoom} className="mt-3"><input type="hidden" name="id" value={r.id} /><Submit className="text-xs font-semibold text-sale" confirm="Delete this room?">Delete room</Submit></form>
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}

function CatForm({ rooms, c }: { rooms: { id: string; name: string }[]; c?: typeof s.categories.$inferSelect }) {
  return (
    <form action={saveCategory} className="mt-4 grid gap-3 md:grid-cols-[auto_1fr_1fr]">
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="md:row-span-3"><p className="label">Image</p><ImageList name="image" single initial={c?.image ? [c.image] : []} /></div>
      <Field label="Name *"><input name="name" required defaultValue={c?.name} className="input" /></Field>
      <Field label="Slug"><input name="slug" defaultValue={c?.slug} placeholder="auto" className="input" /></Field>
      <Field label="Room"><select name="roomId" defaultValue={c?.roomId || ""} className="input"><option value="">— None —</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
      <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} className="input" /></Field>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <Check name="active" label="Visible" defaultChecked={c ? c.active : true} />
        <Check name="featured" label="Show in home “Our Product Categories”" defaultChecked={c?.featured} />
        <Submit className="btn-gold btn-sm ml-auto">Save</Submit>
      </div>
    </form>
  );
}

function RoomForm({ r }: { r?: typeof s.rooms.$inferSelect }) {
  return (
    <form action={saveRoom} className="mt-4 grid gap-3 md:grid-cols-[auto_1fr_1fr]">
      {r && <input type="hidden" name="id" value={r.id} />}
      <div className="md:row-span-3"><p className="label">Image</p><ImageList name="image" single initial={r?.image ? [r.image] : []} /></div>
      <Field label="Name *"><input name="name" required defaultValue={r?.name} className="input" /></Field>
      <Field label="Slug"><input name="slug" defaultValue={r?.slug} placeholder="auto" className="input" /></Field>
      <Field label="Short description"><input name="description" defaultValue={r?.description || ""} className="input" /></Field>
      <Field label="Sort order"><input name="sortOrder" type="number" defaultValue={r?.sortOrder ?? 0} className="input" /></Field>
      <div className="flex items-center gap-4 md:col-span-2"><Check name="showOnHome" label="Show as large tile on Categories page" defaultChecked={r?.showOnHome} /><Submit className="btn-gold btn-sm ml-auto">Save</Submit></div>
    </form>
  );
}
