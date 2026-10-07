"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { openRazorpay } from "./checkout-page";

export function RetryPayment({ orderNo, k, methods }: { orderNo: string; k: string; methods: { razorpay: boolean; phonepe: boolean } }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const go = async (method: "RAZORPAY" | "PHONEPE") => {
    setBusy(method); setErr("");
    const d = await fetch("/api/payment/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderNo, k, method }) }).then((r) => r.json()).catch(() => ({ ok: false }));
    if (!d.ok) { setBusy(null); setErr(d.error || "Could not start payment."); return; }
    if (d.redirectExternal) { window.location.href = d.redirectExternal; return; }
    await openRazorpay(d.razorpay, orderNo, () => { setBusy(null); router.refresh(); });
  };
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {methods.razorpay && <button onClick={() => go("RAZORPAY")} disabled={!!busy} className="btn-gold">{busy === "RAZORPAY" && <Loader2 className="h-4 w-4 animate-spin" />}Pay now (UPI / Card)</button>}
      {methods.phonepe && <button onClick={() => go("PHONEPE")} disabled={!!busy} className="btn-dark">{busy === "PHONEPE" && <Loader2 className="h-4 w-4 animate-spin" />}Pay with PhonePe</button>}
      {err && <p className="w-full text-sm text-sale">{err}</p>}
    </div>
  );
}
