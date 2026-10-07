"use client";
import { useActionState, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { loginAction, registerAction, type AuthState } from "@/lib/auth-actions";

export function AuthForm({ next, initialTab = "login" }: { next: string; initialTab?: "login" | "register" }) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [ls, login, lp] = useActionState<AuthState, FormData>(loginAction, undefined);
  const [rs, register, rp] = useActionState<AuthState, FormData>(registerAction, undefined);
  return (
    <div className="w-full max-w-[400px]">
      <h1 className="h-display text-[44px]">{tab === "login" ? "Login" : "Create account"}</h1>
      <p className="text-sm text-muted">{tab === "login" ? "Good to see you again." : "Save your wishlist, track orders and check out faster."}</p>
      <div className="mt-6 grid grid-cols-2 rounded-xl bg-[#F3ECE1] p-1">
        {(["login", "register"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg py-2.5 text-sm font-semibold capitalize ${tab === t ? "bg-white shadow-sm" : "text-muted"}`}>{t}</button>
        ))}
      </div>
      {tab === "login" ? (
        <form action={login} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div><label className="label">Email or Phone</label><input name="email" required autoComplete="username" className="input" placeholder="you@example.com" /></div>
          <div><label className="label">Password</label><input name="password" type="password" required autoComplete="current-password" className="input" placeholder="••••••••" /></div>
          {ls?.error && <p className="rounded-lg bg-[#FDECEE] p-3 text-sm text-sale">{ls.error}</p>}
          <button disabled={lp} className="btn-gold w-full">{lp && <Loader2 className="h-4 w-4 animate-spin" />}Login <ArrowRight className="h-4 w-4" /></button>
          <p className="text-center text-sm text-muted">New here? <button type="button" onClick={() => setTab("register")} className="link-gold">Create an account</button></p>
          <p className="text-center text-xs text-muted">Forgot password? Contact us on WhatsApp and we&apos;ll reset it.</p>
        </form>
      ) : (
        <form action={register} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div><label className="label req">Full name</label><input name="name" required autoComplete="name" className="input" /></div>
          <div><label className="label req">Email</label><input name="email" type="email" required autoComplete="email" className="input" /></div>
          <div><label className="label">Mobile number</label><input name="phone" type="tel" autoComplete="tel" className="input" placeholder="98xxx xxxxx" /></div>
          <div><label className="label req">Password</label><input name="password" type="password" required minLength={6} autoComplete="new-password" className="input" /></div>
          {rs?.error && <p className="rounded-lg bg-[#FDECEE] p-3 text-sm text-sale">{rs.error}</p>}
          <button disabled={rp} className="btn-gold w-full">{rp && <Loader2 className="h-4 w-4 animate-spin" />}Create account <ArrowRight className="h-4 w-4" /></button>
        </form>
      )}
    </div>
  );
}
