"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema as s } from "./db";
import { createSession, destroySession } from "./auth";

export type AuthState = { error?: string; tab?: "login" | "register" } | undefined;

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

export async function loginAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const id = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const next = safeNext(fd.get("next"));
  if (!id || !password) return { error: "Enter your email/phone and password.", tab: "login" };
  const digits = id.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  const user = id.includes("@")
    ? await db.query.users.findFirst({ where: eq(s.users.email, id) })
    : await db.query.users.findFirst({ where: eq(s.users.phone, digits) });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "Incorrect email/phone or password.", tab: "login" };
  await createSession({ uid: user.id, name: user.name, email: user.email, role: user.role as "CUSTOMER" | "ADMIN" });
  redirect(user.role === "ADMIN" && next === "/account" ? "/admin" : next);
}

export async function registerAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const name = String(fd.get("name") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const phone = String(fd.get("phone") || "").replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  const password = String(fd.get("password") || "");
  const next = safeNext(fd.get("next"));
  if (name.length < 2) return { error: "Please enter your name.", tab: "register" };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter a valid email.", tab: "register" };
  if (phone && !/^[6-9]\d{9}$/.test(phone)) return { error: "Please enter a valid 10-digit mobile number.", tab: "register" };
  if (password.length < 6) return { error: "Password must be at least 6 characters.", tab: "register" };
  const exists = await db.query.users.findFirst({ where: eq(s.users.email, email) });
  if (exists) return { error: "An account with this email already exists. Please log in.", tab: "register" };
  if (phone && (await db.query.users.findFirst({ where: eq(s.users.phone, phone) }))) return { error: "This phone number is already registered.", tab: "register" };
  const [u] = await db.insert(s.users).values({ name, email, phone: phone || null, passwordHash: await bcrypt.hash(password, 10) }).returning();
  await createSession({ uid: u.id, name: u.name, email: u.email, role: "CUSTOMER" });
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
