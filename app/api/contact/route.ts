import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema as s } from "@/lib/db";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(20),
  email: z.string().trim().email("Please enter a valid email"),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(5, "Please write a short message").max(3000),
  company: z.string().optional(), // honeypot
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  if (parsed.data.company) return NextResponse.json({ ok: true });
  const { company: _c, ...data } = parsed.data;
  await db.insert(s.contactMessages).values(data);
  return NextResponse.json({ ok: true });
}
