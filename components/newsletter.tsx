"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  return (
    <section className="border-t border-line bg-cream">
      <div className="container-site flex flex-col items-center py-14 text-center md:py-16">
        <p className="eyebrow">The Wooden Tone Circle</p>
        <h2 className="h-section mt-3">Stay in the Loop</h2>
        <p className="mt-3 max-w-md text-sm text-muted">New arrivals, festive offers and care tips for your wooden furniture — once a week, never more.</p>
        <form
          className="mt-7 w-full max-w-[480px]"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("loading");
            const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
            const d = await r.json().catch(() => ({}));
            if (r.ok) { setState("done"); setMsg("Thank you — you're subscribed!"); setEmail(""); }
            else { setState("error"); setMsg(d.error || "Please enter a valid email."); }
          }}
        >
          <div className="flex items-center border-b border-ink/70 focus-within:border-teak">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address"
              className="w-full bg-transparent py-3 text-ink outline-none placeholder:text-muted" aria-label="Email address" />
            <button disabled={state === "loading"} className="flex shrink-0 items-center gap-2 py-3 pl-3 text-[12px] font-medium uppercase tracking-[0.18em] text-ink transition hover:text-teak-dark disabled:opacity-50">
              Subscribe <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {msg && <p className={`mt-2 text-left text-xs ${state === "error" ? "text-sale" : "text-stock"}`}>{msg}</p>}
        </form>
      </div>
    </section>
  );
}
