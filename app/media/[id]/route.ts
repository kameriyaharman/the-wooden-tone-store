import { eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";

const CACHE = "public, max-age=31536000, immutable";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const range = req.headers.get("range");

  // Videos need byte-range responses (Safari/iOS won't play without them) — fetch only the requested slice.
  if (range) {
    const [meta] = await db.select({ mime: s.media.mime, size: s.media.size }).from(s.media).where(eq(s.media.id, id));
    if (!meta) return new Response("Not found", { status: 404 });
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? Number(m[1]) : NaN;
    let end = m && m[2] ? Number(m[2]) : NaN;
    if (Number.isNaN(start)) { start = Math.max(0, meta.size - (Number.isNaN(end) ? meta.size : end)); end = meta.size - 1; }
    if (Number.isNaN(end) || end >= meta.size) end = Math.min(meta.size - 1, start + 4 * 1024 * 1024 - 1);
    if (start >= meta.size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${meta.size}` } });
    const [row] = await db.select({ chunk: sql<Buffer>`substring(${s.media.data} from ${start + 1} for ${end - start + 1})` }).from(s.media).where(eq(s.media.id, id));
    const chunk = Buffer.isBuffer(row.chunk) ? row.chunk : Buffer.from(row.chunk);
    return new Response(new Uint8Array(chunk), {
      status: 206,
      headers: { "Content-Type": meta.mime, "Cache-Control": CACHE, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${start + chunk.length - 1}/${meta.size}`, "Content-Length": String(chunk.length) },
    });
  }

  const m = await db.query.media.findFirst({ where: eq(s.media.id, id) });
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(m.data), {
    headers: { "Content-Type": m.mime, "Cache-Control": CACHE, "Content-Length": String(m.size), "Accept-Ranges": "bytes" },
  });
}
