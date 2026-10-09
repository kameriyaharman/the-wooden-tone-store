import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveVideo } from "@/lib/media";

export const maxDuration = 120;

export async function POST(req: Request) {
  const s = await getSession();
  if (!s || s.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const f = (await req.formData()).get("file");
  if (!(f instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  try {
    return NextResponse.json({ url: await saveVideo(f) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
