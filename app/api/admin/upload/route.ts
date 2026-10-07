import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveUpload } from "@/lib/media";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = await req.formData();
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  try {
    const urls: string[] = [];
    for (const f of files) urls.push(await saveUpload(f, { maxWidth: 2000 }));
    return NextResponse.json({ urls });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
