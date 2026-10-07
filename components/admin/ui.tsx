import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function AdminHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-3xl font-semibold md:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
export function Flash({ show, msg = "Saved successfully.", error }: { show?: boolean | string; msg?: string; error?: string }) {
  if (error) return <p className="mb-4 rounded-lg bg-[#FDECEE] p-3 text-sm text-sale">{error}</p>;
  if (!show) return null;
  return <p className="mb-4 flex items-center gap-2 rounded-lg bg-[#E8F5EE] p-3 text-sm text-stock"><CheckCircle2 className="h-4 w-4" /> {msg}</p>;
}
export function Panel({ title, children, className = "", actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {(title || actions) && <div className="mb-4 flex items-center justify-between gap-3">{title && <h2 className="text-[15px] font-bold">{title}</h2>}{actions}</div>}
      {children}
    </section>
  );
}
export const th = "px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted";
export const td = "px-3 py-3 align-middle";
export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b border-line bg-cream/60"><tr>{head.map((h, i) => <th key={i} className={th}>{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <p className="p-8 text-center text-sm text-muted">Nothing here yet.</p>}
    </div>
  );
}
const statusColors: Record<string, string> = {
  PENDING_PAYMENT: "bg-[#F3ECE1] text-muted", PLACED: "bg-[#FFF3D6] text-[#9A6A00]", CONFIRMED: "bg-[#E6EEFF] text-[#2F55B5]",
  PACKED: "bg-[#EDE6FF] text-[#6440B5]", SHIPPED: "bg-[#E0F4F7] text-[#167C8C]", OUT_FOR_DELIVERY: "bg-[#FFE9D9] text-[#B85A12]",
  DELIVERED: "bg-[#E8F5EE] text-stock", CANCELLED: "bg-[#FDECEE] text-sale", RETURNED: "bg-[#FDECEE] text-sale",
  PAID: "bg-[#E8F5EE] text-stock", PENDING: "bg-[#F3ECE1] text-muted", FAILED: "bg-[#FDECEE] text-sale", REFUNDED: "bg-[#EDE6FF] text-[#6440B5]",
  NEW: "bg-[#FFF3D6] text-[#9A6A00]", QUOTED: "bg-[#E6EEFF] text-[#2F55B5]", CLOSED: "bg-[#F3ECE1] text-muted",
};
export function Badge({ v, label }: { v: string; label?: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColors[v] || "bg-cream text-ink"}`}>{label || v.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</span>;
}
export function Pager({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null;
  const sep = base.includes("?") ? "&" : "?";
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      {page > 1 && <Link className="btn-outline btn-sm" href={`${base}${sep}page=${page - 1}`}>← Prev</Link>}
      <span className="text-muted">Page {page} of {pages}</span>
      {page < pages && <Link className="btn-outline btn-sm" href={`${base}${sep}page=${page + 1}`}>Next →</Link>}
    </div>
  );
}
export function Field({ label, children, hint, className = "" }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#C4841D]" /> {label}</label>;
}
