import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { db, schema as s } from "@/lib/db";
import { LIVE_DATA_KEY, LIVE_FLAG, liveImportStatus, runLiveImport, type LiveProduct } from "@/lib/live-import";
import { eq } from "drizzle-orm";

// One-time upload of the old site's catalogue. The browser posts it from
// thewoodentone.com as text/plain (no CORS preflight); a shared IMPORT_TOKEN
// guards it. Remove IMPORT_TOKEN from the environment once the import is done.
const ORIGIN = "https://thewoodentone.com";
const cors = { "Access-Control-Allow-Origin": ORIGIN };

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const st = liveImportStatus();
  const flag = await db.query.settings.findFirst({ where: eq(s.settings.key, LIVE_FLAG) });
  if (!st.running) revalidateTag("catalog");
  return NextResponse.json({ ...st, log: st.log.slice(-15), completedAt: flag?.value ?? null }, { headers: cors });
}

export async function POST(req: Request) {
  const token = process.env.IMPORT_TOKEN || "";
  let body: { token?: string; data?: LiveProduct[]; force?: boolean };
  try { body = JSON.parse(await req.text()); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400, headers: cors }); }
  if (token.length < 20 || body.token !== token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  const data = Array.isArray(body.data) ? body.data.filter((p) => p && typeof p.slug === "string") : [];
  if (!data.length) return NextResponse.json({ error: "No products" }, { status: 400, headers: cors });
  await db.insert(s.settings).values({ key: LIVE_DATA_KEY, value: data }).onConflictDoUpdate({ target: s.settings.key, set: { value: data } });
  void runLiveImport(data, { force: !!body.force }); // runs in the background; poll GET for progress
  return NextResponse.json({ ok: true, received: data.length }, { headers: cors });
}
