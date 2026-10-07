"use client";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { loginAction, type AuthState } from "@/lib/auth-actions";

export function AdminLoginForm() {
  const [st, action, pending] = useActionState<AuthState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value="/admin" />
      <div><label className="label">Email</label><input name="email" type="email" required autoComplete="username" className="input" /></div>
      <div><label className="label">Password</label><input name="password" type="password" required autoComplete="current-password" className="input" /></div>
      {st?.error && <p className="rounded-lg bg-[#FDECEE] p-3 text-sm text-sale">{st.error}</p>}
      <button disabled={pending} className="btn-gold w-full">{pending && <Loader2 className="h-4 w-4 animate-spin" />}Sign in</button>
    </form>
  );
}
