import "server-only";
import sharp from "sharp";
import { db, schema as s } from "./db";

const OK = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "application/pdf"];

export async function saveUpload(file: File, opts: { maxWidth?: number } = {}) {
  if (!file || !file.size) throw new Error("Empty file");
  if (file.size > 10 * 1024 * 1024) throw new Error("File is larger than 10 MB");
  if (!OK.includes(file.type)) throw new Error("Only JPG, PNG, WEBP or PDF files are allowed");
  let buf: Buffer = Buffer.from(await file.arrayBuffer());
  let mime = file.type;
  if (mime.startsWith("image/") && mime !== "image/gif") {
    buf = await sharp(buf).rotate().resize({ width: opts.maxWidth || 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    mime = "image/webp";
  }
  const [row] = await db.insert(s.media).values({ filename: file.name.slice(0, 200), mime, size: buf.length, data: buf }).returning({ id: s.media.id });
  return `/media/${row.id}`;
}
