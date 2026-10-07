import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema as s } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ email: z.string().trim().toLowerCase().email() }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  await db.insert(s.subscribers).values({ email: parsed.data.email }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}
