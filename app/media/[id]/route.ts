import { eq } from "drizzle-orm";
import { db, schema as s } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await db.query.media.findFirst({ where: eq(s.media.id, id) });
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(m.data), {
    headers: { "Content-Type": m.mime, "Cache-Control": "public, max-age=31536000, immutable", "Content-Length": String(m.size) },
  });
}
