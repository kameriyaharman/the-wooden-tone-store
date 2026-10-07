import { NextResponse } from "next/server";
import { db, schema as s } from "@/lib/db";
import { saveUpload } from "@/lib/media";

export async function POST(req: Request) {
  const fd = await req.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  const str = (k: string) => String(fd.get(k) || "").trim();
  if (str("company")) return NextResponse.json({ ok: true });
  const name = str("name"), phone = str("phone"), itemType = str("itemType");
  if (!itemType) return NextResponse.json({ error: "Please choose what you want to make." }, { status: 400 });
  if (!str("width") || !str("depth")) return NextResponse.json({ error: "Please enter the width and depth/length." }, { status: 400 });
  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Please enter a valid phone / WhatsApp number." }, { status: 400 });
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 5);
  const images: string[] = [];
  try {
    for (const f of files) images.push(await saveUpload(f));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  await db.insert(s.customOrders).values({
    itemType, wood: str("wood") || null, width: str("width"), depth: str("depth"), height: str("height") || null,
    budget: str("budget") || null, images, name, phone, notes: str("notes") || null,
  });
  return NextResponse.json({ ok: true });
}
