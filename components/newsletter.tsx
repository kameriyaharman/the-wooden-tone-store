"use client";
import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  return (
    <section className="bg-gradient-to-r from-[#C4841D] to-[#D99A2E] text-white">
      <div className="container-site flex flex-col items-center gap-6 py-12 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <h2 className="h-display text-4xl md:text-[44px]">Stay in the Loop</h2>
          <p className="mt-1 text-sm text-white/90">New arrivals, festive offers and care tips for your wooden furniture — once a week.</p>
        </div>
        <form
          className="flex w-full max-w-[520px] gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("loading");
            const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
            const d = await r.json().catch(() => ({}));
            if (r.ok) { setState("done"); setMsg("Thanks — you're subscribed!"); setEmail(""); }
            else { setState("error"); setMsg(d.error || "Please enter a valid email."); }
          }}
        >
          <div className="flex-1">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address"
              className="w-full rounded-lg bg-white px-4 py-3 text-ink outline-none placeholder:text-[#9A9187]" aria-label="Email address" />
            {msg && <p className={`mt-1.5 text-left text-xs ${state === "error" ? "text-white" : "text-white"}`}>{msg}</p>}
          </div>
          <button disabled={state === "loading"} className="btn-dark h-[48px] px-6">Subscribe</button>
        </form>
      </div>
    </section>
  );
}
