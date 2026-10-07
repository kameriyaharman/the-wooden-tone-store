"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Upload, X } from "lucide-react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  if (state === "done")
    return (
      <div className="py-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-stock" />
        <p className="mt-3 font-serif text-2xl font-semibold">Message sent!</p>
        <p className="mt-1 text-sm text-muted">Our team will reply within 24 hours.</p>
      </div>
    );
  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending"); setErr("");
        const body = Object.fromEntries(new FormData(e.currentTarget));
        const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const d = await r.json().catch(() => ({}));
        if (r.ok) setState("done"); else { setState("idle"); setErr(d.error || "Please check the form."); }
      }}
    >
      <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <div><label className="label req">Full Name</label><input name="name" required className="input" placeholder="Your name" /></div>
      <div><label className="label req">Phone Number</label><input name="phone" type="tel" required className="input" placeholder="+91" /></div>
      <div className="md:col-span-2"><label className="label req">Email Address</label><input name="email" type="email" required className="input" placeholder="you@example.com" /></div>
      <div className="md:col-span-2">
        <label className="label req">Subject</label>
        <select name="subject" className="input">
          <option>Product enquiry</option><option>Order &amp; delivery</option><option>Custom order</option><option>Returns &amp; refunds</option><option>Bulk / business order</option><option>Other</option>
        </select>
      </div>
      <div className="md:col-span-2"><label className="label req">Message</label><textarea name="message" required rows={5} className="input" placeholder="Tell us what you're looking for…" /></div>
      {err && <p className="text-sm text-sale md:col-span-2">{err}</p>}
      <button disabled={state === "sending"} className="btn-gold justify-self-start">{state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Send Message <ArrowRight className="h-4 w-4" /></button>
    </form>
  );
}

const TYPES = ["Bed", "Sofa", "Dining Set", "Wardrobe", "TV Unit", "Mandir", "Table", "Other"];
const WOODS = ["Sheesham", "Teak", "Mango", "Not sure"];
const BUDGETS = ["Under ₹25,000", "₹25,000 – ₹50,000", "₹50,000 – ₹1,00,000", "₹1,00,000 – ₹2,00,000", "Above ₹2,00,000"];

export function CustomOrderForm() {
  const [type, setType] = useState("Bed");
  const [wood, setWood] = useState("Sheesham");
  const [files, setFiles] = useState<File[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [err, setErr] = useState("");
  const pill = (on: boolean) => `rounded-full border px-4 py-1.5 text-[13px] transition ${on ? "border-teak bg-tint font-semibold text-teak-dark" : "border-line text-muted hover:border-teak"}`;
  if (state === "done")
    return (
      <div className="py-12 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-stock" />
        <p className="mt-3 font-serif text-3xl font-semibold">Request received!</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Our team will confirm the design, wood and price within 48 hours on WhatsApp/phone.</p>
      </div>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending"); setErr("");
        const fd = new FormData(e.currentTarget);
        fd.set("itemType", type); fd.set("wood", wood);
        fd.delete("files"); files.forEach((f) => fd.append("files", f));
        const r = await fetch("/api/custom-order", { method: "POST", body: fd });
        const d = await r.json().catch(() => ({}));
        if (r.ok) setState("done"); else { setState("idle"); setErr(d.error || "Please check the form."); }
      }}
      className="space-y-5"
    >
      <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <div>
        <p className="label req">What do you want to make?</p>
        <div className="flex flex-wrap gap-2 rounded-xl border border-line p-2">{TYPES.map((t) => <button type="button" key={t} onClick={() => setType(t)} className={pill(type === t)}>{t}</button>)}</div>
      </div>
      <div>
        <p className="label">Preferred wood</p>
        <div className="flex flex-wrap gap-2 rounded-xl border border-line p-2">{WOODS.map((t) => <button type="button" key={t} onClick={() => setWood(t)} className={pill(wood === t)}>{t}</button>)}</div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label req">Width (in)</label><input name="width" required inputMode="decimal" className="input" placeholder="e.g. 72" /></div>
        <div><label className="label req">Depth / Length (in)</label><input name="depth" required inputMode="decimal" className="input" placeholder="e.g. 84" /></div>
        <div><label className="label">Height (in)</label><input name="height" inputMode="decimal" className="input" placeholder="e.g. 40" /></div>
        <div><label className="label">Budget</label><select name="budget" className="input" defaultValue={BUDGETS[2]}>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</select></div>
      </div>
      <div>
        <p className="label">Reference photos / sketch</p>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line px-4 py-8 text-center hover:border-teak">
          <Upload className="h-6 w-6 text-teak" />
          <span className="mt-2 text-sm font-semibold">Drop images here or click to upload</span>
          <span className="text-xs text-muted">JPG, PNG or PDF · up to 10 MB each · max 5</span>
          <input type="file" name="files" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files || [])].slice(0, 5))} />
        </label>
        {files.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs">
                {f.name.slice(0, 28)} <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove"><X className="h-3 w-3" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label req">Full Name</label><input name="name" required className="input" placeholder="Your name" /></div>
        <div><label className="label req">Phone / WhatsApp</label><input name="phone" type="tel" required className="input" placeholder="+91" /></div>
      </div>
      <div><label className="label">Notes</label><textarea name="notes" rows={4} className="input" placeholder="Finish, colour, storage needs…" /></div>
      {err && <p className="text-sm text-sale">{err}</p>}
      <button disabled={state === "sending"} className="btn-gold">{state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}Request a Quote <ArrowRight className="h-4 w-4" /></button>
    </form>
  );
}
