"use client";
import { useFormStatus } from "react-dom";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, Video, X } from "lucide-react";
import { youtubeEmbed } from "@/lib/video";

export function Submit({ children, className = "btn-gold", confirm }: { children: React.ReactNode; className?: string; confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} onClick={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}{children}
    </button>
  );
}

async function upload(files: FileList | File[]) {
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append("files", f));
  const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Upload failed");
  return d.urls as string[];
}

/** Ordered image list with upload, URL paste, reorder and remove. Serialises to a hidden JSON input. */
export function ImageList({ name, initial = [], single = false }: { name: string; initial?: string[]; single?: boolean }) {
  const [imgs, setImgs] = useState<string[]>(initial.filter(Boolean));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const add = async (files: FileList | File[]) => {
    if (!files.length) return;
    setBusy(true); setErr("");
    try {
      const urls = await upload(single ? [files[0]] : files);
      setImgs((x) => (single ? urls.slice(0, 1) : [...x, ...urls]));
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const move = (i: number, d: number) => setImgs((x) => { const a = [...x]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  return (
    <div>
      <input type="hidden" name={name} value={single ? imgs[0] || "" : JSON.stringify(imgs)} />
      <div className="flex flex-wrap gap-3">
        {imgs.map((src, i) => (
          <div key={src + i} className="group relative h-28 w-28 overflow-hidden rounded-xl border border-line bg-cream">
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && !single && <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">Main</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1 opacity-0 transition group-hover:opacity-100">
              {!single && <button type="button" onClick={() => move(i, -1)} className="p-1 text-white" aria-label="Move left"><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>}
              <button type="button" onClick={() => setImgs(imgs.filter((_, j) => j !== i))} className="p-1 text-white" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
              {!single && <button type="button" onClick={() => move(i, 1)} className="p-1 text-white" aria-label="Move right"><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>}
            </div>
          </div>
        ))}
        {(!single || imgs.length === 0) && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
            className={`grid h-28 w-28 place-items-center rounded-xl border-2 border-dashed text-xs text-muted ${drag ? "border-teak bg-tint" : "border-line hover:border-teak"}`}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex flex-col items-center gap-1"><ImagePlus className="h-5 w-5" />Upload</span>}
          </button>
        )}
        {single && imgs.length > 0 && (
          <button type="button" onClick={() => ref.current?.click()} className="self-end text-xs font-semibold text-teak-dark">{busy ? "Uploading…" : "Replace"}</button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple={!single} className="hidden" onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      {err && <p className="mt-1 text-xs text-sale">{err}</p>}
    </div>
  );
}

/** One product video: upload a file (MP4 up to 50 MB) or paste a YouTube / video link. */
export function VideoField({ name, initial = "" }: { name: string; initial?: string }) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const yt = youtubeEmbed(url);
  const upload = (f: File) => {
    if (f.size > 50 * 1024 * 1024) { setErr("Video is larger than 50 MB — please compress it first"); return; }
    setBusy(true); setErr(""); setPct(0);
    const fd = new FormData(); fd.append("file", f);
    const x = new XMLHttpRequest();
    x.open("POST", "/api/admin/upload-video");
    x.upload.onprogress = (e) => e.lengthComputable && setPct(Math.round((e.loaded / e.total) * 100));
    x.onload = () => {
      setBusy(false);
      try { const d = JSON.parse(x.responseText); if (x.status >= 400) setErr(d.error || "Upload failed"); else setUrl(d.url); } catch { setErr("Upload failed"); }
    };
    x.onerror = () => { setBusy(false); setErr("Upload failed — check your connection"); };
    x.send(fd);
  };
  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className="max-w-sm">
          <div className="overflow-hidden rounded-xl border border-line bg-black">
            {yt ? <iframe src={yt} className="aspect-video w-full" allow="encrypted-media; picture-in-picture" allowFullScreen title="Product video" />
              : <video src={url} controls playsInline preload="metadata" className="aspect-video w-full" />}
          </div>
          <div className="mt-2 flex gap-3 text-xs font-semibold">
            <button type="button" onClick={() => ref.current?.click()} className="text-teak-dark">{busy ? `Uploading… ${pct}%` : "Replace"}</button>
            <button type="button" onClick={() => setUrl("")} className="text-sale">Remove</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-3">
          <button type="button" onClick={() => ref.current?.click()} disabled={busy}
            className="grid h-28 w-40 place-items-center rounded-xl border-2 border-dashed border-line text-xs text-muted hover:border-teak">
            {busy ? <span className="flex flex-col items-center gap-1"><Loader2 className="h-5 w-5 animate-spin" />{pct}%</span>
              : <span className="flex flex-col items-center gap-1"><Video className="h-5 w-5" />Upload video<span className="text-[10px]">MP4 · max 50 MB</span></span>}
          </button>
          <div className="min-w-[220px] flex-1">
            <p className="text-xs text-muted">…or paste a YouTube / video link</p>
            <input className="input mt-1" placeholder="https://youtube.com/watch?v=…" onBlur={(e) => { const v = e.target.value.trim(); if (v) setUrl(v); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).blur(); } }} />
          </div>
        </div>
      )}
      <input ref={ref} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      {err && <p className="mt-1 text-xs text-sale">{err}</p>}
    </div>
  );
}

type Col = { key: string; label: string; type?: "text" | "number" | "color"; placeholder?: string; width?: string };
/** Editable rows of objects, serialised to JSON in a hidden input. */
export function Repeater({ name, cols, initial, addLabel = "Add row" }: { name: string; cols: Col[]; initial: Record<string, unknown>[]; addLabel?: string }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>(initial);
  const blank = () => Object.fromEntries(cols.map((c) => [c.key, c.type === "number" ? 0 : c.type === "color" ? "#B9803F" : ""]));
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              {cols.map((c) => (
                <input
                  key={c.key}
                  type={c.type || "text"}
                  value={String(r[c.key] ?? "")}
                  placeholder={c.placeholder || c.label}
                  aria-label={c.label}
                  onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, [c.key]: c.type === "number" ? Number(e.target.value) : e.target.value } : x)))}
                  className={c.type === "color" ? "h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line" : `input ${c.width || "flex-1"}`}
                />
              ))}
              <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="p-2 text-muted hover:text-sale" aria-label="Remove row"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setRows([...rows, blank()])} className="mt-2 flex items-center gap-1 text-xs font-semibold text-teak-dark"><Plus className="h-3.5 w-3.5" /> {addLabel}</button>
    </div>
  );
}

export function SlugField({ initial, source }: { initial?: string; source: string }) {
  const [v, setV] = useState(initial || "");
  return <input name="slug" value={v} onChange={(e) => setV(e.target.value)} placeholder={`auto from ${source}`} className="input" />;
}

export function HomeSectionsEditor({ initial, categories }: { initial: { eyebrow: string; title: string; categories: string[] }[]; categories: { slug: string; name: string }[] }) {
  const [rows, setRows] = useState(initial);
  return (
    <div className="space-y-3">
      <input type="hidden" name="homeSections" value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="rounded-xl border border-line p-3">
          <div className="grid gap-2 md:grid-cols-[1fr_1.4fr_auto]">
            <input className="input" value={r.eyebrow} placeholder="Eyebrow (small text)" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, eyebrow: e.target.value } : x)))} />
            <input className="input" value={r.title} placeholder="Section title" onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <div className="flex gap-1">
              <button type="button" className="btn-outline btn-sm" onClick={() => { const a = [...rows]; if (i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]]; setRows(a); }}><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" className="btn-outline btn-sm" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const on = r.categories.includes(c.slug);
              return (
                <button type="button" key={c.slug} onClick={() => setRows(rows.map((x, j) => (j === i ? { ...x, categories: on ? x.categories.filter((y) => y !== c.slug) : [...x.categories, c.slug] } : x)))}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${on ? "border-teak bg-tint font-semibold text-teak-dark" : "border-line text-muted"}`}>{c.name}</button>
              );
            })}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { eyebrow: "Shop", title: "New section", categories: [] }])} className="flex items-center gap-1 text-xs font-semibold text-teak-dark"><Plus className="h-3.5 w-3.5" /> Add home section</button>
    </div>
  );
}
