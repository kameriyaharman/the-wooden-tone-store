import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema as s } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  name: z.string().trim().min(2).max(60),
  city: z.string().trim().max(60).optional().nullable(),
  text: z.string().trim().min(10).max(1500),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Please fill in your name and a review of at least 10 characters." }, { status: 400 });
  const session = await getSession();
  await db.insert(s.reviews).values({ ...parsed.data, city: parsed.data.city || null, userId: session?.uid || null, approved: false });
  return NextResponse.json({ ok: true });
}
