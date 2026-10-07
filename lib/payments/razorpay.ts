import "server-only";
import crypto from "crypto";
import { getSettings } from "../settings";

export async function razorpayCreds() {
  const st = await getSettings();
  const keyId = process.env.RAZORPAY_KEY_ID || st.razorpayKeyId;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || st.razorpayKeySecret;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || st.razorpayWebhookSecret;
  return { enabled: !!(st.razorpayEnabled && keyId && keySecret), keyId, keySecret, webhookSecret };
}

export async function createRazorpayOrder(amountRupees: number, receipt: string, notes: Record<string, string>) {
  const c = await razorpayCreds();
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64"),
    },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: "INR", receipt, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.description || "Razorpay order creation failed");
  return { id: data.id as string, amount: data.amount as number, keyId: c.keyId };
}

export function hmac(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string) {
  const c = await razorpayCreds();
  return safeEqual(hmac(c.keySecret, `${orderId}|${paymentId}`), signature || "");
}
