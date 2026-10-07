"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Banknote, CreditCard, Loader2, Lock, MapPin, Receipt, ShieldCheck, ShoppingCart, Smartphone, ArrowRight } from "lucide-react";
import { useStore } from "./store-provider";
import { Steps, getSavedCoupon, useQuote } from "./checkout-shared";
import { inr, INDIAN_STATES } from "@/lib/format";
import { navStart } from "./nav-progress";

type Methods = { razorpay: boolean; phonepe: boolean; cod: boolean; codFee: number; codMax: number };
type Addr = { firstName: string; lastName: string; email: string; phone: string; line1: string; city: string; state: string; pincode: string; landmark: string };
const ADDR_KEY = "twt_addr_v1";
const empty: Addr = { firstName: "", lastName: "", email: "", phone: "", line1: "", city: "", state: "", pincode: "", landmark: "" };

declare global {
  interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } }
}

export function loadRazorpay() {
  return new Promise<boolean>((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

export type RzpData = { key: string; orderId: string; amount: number; name: string; prefill: Record<string, string> };

export async function openRazorpay(rz: RzpData, orderNo: string, onDone: (ok: boolean) => void) {
  const ok = await loadRazorpay();
  if (!ok || !window.Razorpay) return onDone(false);
  const r = new window.Razorpay({
    key: rz.key, order_id: rz.orderId, amount: rz.amount, currency: "INR", name: rz.name, description: `Order ${orderNo}`,
    image: `${window.location.origin}/seed/logo-square.png`, prefill: rz.prefill, theme: { color: "#C4841D" },
    handler: async (resp: Record<string, string>) => {
      const v = await fetch("/api/payment/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNo, ...resp }) }).then((x) => x.json()).catch(() => ({ ok: false }));
      onDone(!!v.ok);
    },
    modal: { ondismiss: () => onDone(false), confirm_close: true },
  });
  r.on("payment.failed", () => {
    fetch("/api/payment/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNo, failed: true }) });
  });
  r.open();
}

export function CheckoutPage({ methods, loggedIn, user, savedAddr }: { methods: Methods; loggedIn: boolean; user: { name: string; email: string } | null; savedAddr: Partial<Addr> | null }) {
  const router = useRouter();
  const { items, ready, clear } = useStore();
  const defaultMethod = methods.razorpay ? "RAZORPAY" : methods.phonepe ? "PHONEPE" : "COD";
  const [method, setMethod] = useState(defaultMethod);
  const [coupon, setCoupon] = useState("");
  const [a, setA] = useState<Addr>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Addr, string>>>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  useEffect(() => {
    setCoupon(getSavedCoupon());
    let stored: Partial<Addr> = {};
    try { stored = JSON.parse(localStorage.getItem(ADDR_KEY) || "{}"); } catch {}
    const [fn, ...ln] = (user?.name || "").split(" ");
    setA({ ...empty, firstName: fn || "", lastName: ln.join(" "), email: user?.email || "", ...stored, ...(savedAddr || {}) });
  }, [user, savedAddr]);
  const { q, loading } = useQuote(coupon, method);

  const set = (k: keyof Addr) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setA((x) => ({ ...x, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };
  const lookupPin = async (pin: string) => {
    if (!/^\d{6}$/.test(pin)) return;
    try {
      const d = await fetch(`https://api.postalpincode.in/pincode/${pin}`).then((r) => r.json());
      const po = d?.[0]?.PostOffice?.[0];
      if (po) {
        const st = INDIAN_STATES.find((s) => s.toLowerCase() === String(po.State).toLowerCase()) || po.State;
        setA((x) => ({ ...x, city: x.city || po.District, state: x.state || st }));
      }
    } catch {}
  };

  const validate = () => {
    const e: Partial<Record<keyof Addr, string>> = {};
    if (!a.firstName.trim()) e.firstName = "Required";
    if (!/^\S+@\S+\.\S+$/.test(a.email)) e.email = "Enter a valid email";
    if (!/^[6-9]\d{9}$/.test(a.phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, ""))) e.phone = "Enter a valid 10-digit mobile number";
    if (a.line1.trim().length < 5) e.line1 = "Enter house no., street and area";
    if (!a.city.trim()) e.city = "Required";
    if (!/^\d{6}$/.test(a.pincode)) e.pincode = "6-digit PIN";
    if (!a.state) e.state = "Select state";
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.focus();
      return false;
    }
    return true;
  };

  const place = async () => {
    setErr("");
    if (!validate()) return;
    setBusy(true);
    try { localStorage.setItem(ADDR_KEY, JSON.stringify(a)); } catch {}
    const res = await fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map(({ productId, qty, finish, size }) => ({ productId, qty, finish, size })), coupon: q?.couponCode || null, method, address: a, note: note || undefined }),
    });
    const d = await res.json().catch(() => ({ ok: false, error: "Network error. Please try again." }));
    if (!d.ok) {
      setBusy(false);
      setErr(d.error || "Something went wrong.");
      if (d.field && d.field in empty) setErrors((x) => ({ ...x, [d.field]: d.error }));
      return;
    }
    if (d.redirectExternal) { clear(); window.location.href = d.redirectExternal; return; }
    if (d.razorpay) {
      await openRazorpay(d.razorpay, d.orderNo, (ok) => {
        clear();
        router.push(d.redirect + (ok ? "" : "&pay=retry"));
      });
      return;
    }
    navStart();
    clear();
    router.push(d.redirect);
  };

  if (!ready) return <div className="container-site py-24" />;
  if (!items.length)
    return (
      <div className="container-site py-20 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-line" />
        <h1 className="h-display mt-4 text-4xl">Your cart is empty</h1>
        <Link href="/shop" className="btn-gold mt-6">Start shopping <ArrowRight className="h-4 w-4" /></Link>
      </div>
    );

  const field = (k: keyof Addr, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, req = true) => (
    <div>
      <label htmlFor={`f-${k}`} className={`label ${req ? "req" : ""}`}>{label}</label>
      <input id={`f-${k}`} value={a[k]} onChange={set(k)} className={`input ${errors[k] ? "!border-sale" : ""}`} {...props} />
      {errors[k] && <p className="mt-1 text-xs text-sale">{errors[k]}</p>}
    </div>
  );
  const total = q?.ok ? q.total : items.reduce((x, y) => x + y.price * y.qty, 0);
  const codBlocked = methods.cod && methods.codMax > 0 && total > methods.codMax;
  const opts = [
    methods.razorpay && { v: "RAZORPAY", Icon: CreditCard, t: "UPI / Cards / Netbanking / Wallets", d: "GPay, PhonePe, Paytm, Visa, Mastercard, RuPay — via Razorpay" },
    methods.phonepe && { v: "PHONEPE", Icon: Smartphone, t: "PhonePe", d: "Pay with PhonePe UPI, cards or wallet" },
    methods.cod && { v: "COD", Icon: Banknote, t: "Cash on Delivery", d: codBlocked ? `Available for orders up to ${inr(methods.codMax)}` : `Pay when your furniture arrives${methods.codFee ? ` · ${inr(methods.codFee)} COD fee` : ""}`, disabled: codBlocked },
  ].filter(Boolean) as { v: string; Icon: typeof Banknote; t: string; d: string; disabled?: boolean }[];

  const summary = (
    <div className="card p-5 md:p-6">
      <h2 className="flex items-center gap-3 font-serif text-3xl font-semibold"><span className="icon-chip"><Receipt className="h-4 w-4" /></span>Order Summary</h2>
      <ul className="mt-4 space-y-3">
        {items.map((it) => (
          <li key={it.key} className="flex items-center gap-3">
            {it.image && <img src={it.image} alt="" className="h-14 w-14 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[13px] font-medium">{it.name.replace(/^The Wooden Tone /, "")}</p>
              <p className="text-[11px] text-muted">Qty {it.qty}{it.size ? ` · ${it.size}` : ""}{it.finish ? ` · ${it.finish}` : ""}</p>
            </div>
            <p className="text-sm font-bold">{inr(it.price * it.qty)}</p>
          </li>
        ))}
      </ul>
      <dl className={`mt-5 space-y-2 border-t border-line pt-4 text-sm ${loading ? "opacity-60" : ""}`}>
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{inr(q?.ok ? q.subtotal : total)}</dd></div>
        {q?.ok && q.couponDiscount > 0 && <div className="flex justify-between"><dt className="text-muted">Coupon ({q.couponCode})</dt><dd className="text-stock">− {inr(q.couponDiscount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd className="font-semibold text-stock">{q?.ok && q.shipping ? inr(q.shipping) : "FREE"}</dd></div>
        {q?.ok && q.codFee > 0 && <div className="flex justify-between"><dt className="text-muted">COD fee</dt><dd>{inr(q.codFee)}</dd></div>}
        <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>Order total</dt><dd>{inr(total)}</dd></div>
      </dl>
      {q && !q.ok && <p className="mt-3 rounded-lg bg-[#FDECEE] p-3 text-sm text-sale">{q.error}</p>}
      {err && <p className="mt-3 rounded-lg bg-[#FDECEE] p-3 text-sm text-sale" role="alert">{err}</p>}
      <button onClick={place} disabled={busy || (q !== null && !q.ok)} className="btn-gold mt-5 w-full !py-3.5">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {method === "COD" ? "Place Order" : "Pay"} · {inr(total)}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-stock"><ShieldCheck className="h-3.5 w-3.5" /> 100% secure checkout · SSL encrypted</p>
      <p className="mt-1 text-center text-[11px] text-muted">By placing your order you agree to our <Link href="/pages/terms-of-service" className="underline">Terms</Link> &amp; <Link href="/pages/refund-and-cancellation" className="underline">Refund Policy</Link>.</p>
    </div>
  );

  return (
    <div className="container-site py-8">
      <Steps step={2} />
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="card p-5 md:p-6">
            <h1 className="flex items-center gap-3 font-serif text-3xl font-semibold"><span className="icon-chip"><MapPin className="h-4 w-4" /></span>Delivery Address</h1>
            {!loggedIn && (
              <div className="mt-4 rounded-xl border border-[#EADFCB] bg-tint p-3.5 text-[13px]">
                <p className="font-semibold text-teak-dark">Guest Checkout</p>
                <p className="text-teak-dark/80">You can checkout as a guest or <Link href="/login?next=/checkout" className="underline">login</Link> to save your details.</p>
              </div>
            )}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {field("firstName", "First Name", { placeholder: "e.g. Rahul", autoComplete: "given-name" })}
              {field("lastName", "Last Name", { placeholder: "e.g. Sharma", autoComplete: "family-name" }, false)}
              <div className="md:col-span-2">{field("email", "Email Address", { type: "email", placeholder: "you@example.com", autoComplete: "email" })}</div>
              <div className="md:col-span-2">{field("phone", "Phone Number", { type: "tel", inputMode: "tel", placeholder: "98xxx xxxxx", autoComplete: "tel" })}</div>
              <div className="md:col-span-2">{field("line1", "Address", { placeholder: "House no., street, area", autoComplete: "street-address" })}</div>
              {field("pincode", "PIN Code", { inputMode: "numeric", maxLength: 6, placeholder: "6-digit PIN", autoComplete: "postal-code", onBlur: (e) => lookupPin(e.currentTarget.value) })}
              {field("city", "City", { placeholder: "City", autoComplete: "address-level2" })}
              <div>
                <label htmlFor="f-state" className="label req">State</label>
                <select id="f-state" value={a.state} onChange={set("state")} className={`input ${errors.state ? "!border-sale" : ""}`}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
                {errors.state && <p className="mt-1 text-xs text-sale">{errors.state}</p>}
              </div>
              {field("landmark", "Landmark", { placeholder: "Optional" }, false)}
              <div className="md:col-span-2">
                <label className="label">Order notes</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input" placeholder="Optional — delivery instructions, preferred time…" />
              </div>
            </div>
          </div>
          <div className="card p-5 md:p-6">
            <h2 className="flex items-center gap-3 font-serif text-3xl font-semibold"><span className="icon-chip"><CreditCard className="h-4 w-4" /></span>Payment Method</h2>
            <div className="mt-4 space-y-3">
              {opts.map((o) => (
                <label key={o.v} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${method === o.v ? "border-teak bg-[#FFFBF3]" : "border-line"} ${o.disabled ? "cursor-not-allowed opacity-50" : ""}`}>
                  <input type="radio" name="pm" className="h-4 w-4 accent-[#C4841D]" checked={method === o.v} disabled={o.disabled} onChange={() => setMethod(o.v)} />
                  <o.Icon className="h-5 w-5 text-ink" />
                  <span><span className="block text-sm font-semibold">{o.t}</span><span className="text-xs text-muted">{o.d}</span></span>
                </label>
              ))}
              {opts.length === 0 && <p className="text-sm text-sale">No payment method is enabled yet. Please contact us to order.</p>}
            </div>
          </div>
          <div className="lg:hidden">{summary}</div>
        </div>
        <div className="hidden lg:sticky lg:top-24 lg:block">{summary}</div>
      </div>
    </div>
  );
}
