import "server-only";
import { getSettings } from "../settings";

let tokenCache: { token: string; exp: number; key: string } | null = null;

export async function phonepeCreds() {
  const st = await getSettings();
  const clientId = process.env.PHONEPE_CLIENT_ID || st.phonepeClientId;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET || st.phonepeClientSecret;
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION || st.phonepeClientVersion || "1";
  const env = (process.env.PHONEPE_ENV || st.phonepeEnv || "SANDBOX").toUpperCase();
  const prod = env === "PRODUCTION";
  return {
    enabled: !!(st.phonepeEnabled && clientId && clientSecret),
    clientId, clientSecret, clientVersion,
    authUrl: prod ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token" : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    base: prod ? "https://api.phonepe.com/apis/pg" : "https://api-preprod.phonepe.com/apis/pg-sandbox",
  };
}

async function token() {
  const c = await phonepeCreds();
  const key = c.clientId + c.authUrl;
  if (tokenCache && tokenCache.key === key && tokenCache.exp - 60 > Date.now() / 1000) return tokenCache.token;
  const res = await fetch(c.authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: c.clientId, client_version: String(c.clientVersion), client_secret: c.clientSecret, grant_type: "client_credentials" }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error(data?.message || "PhonePe authorization failed");
  tokenCache = { token: data.access_token, exp: Number(data.expires_at) || Date.now() / 1000 + 600, key };
  return tokenCache.token;
}

export async function createPhonePePayment(merchantOrderId: string, amountRupees: number, redirectUrl: string) {
  const c = await phonepeCreds();
  const res = await fetch(`${c.base}/checkout/v2/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${await token()}` },
    body: JSON.stringify({
      merchantOrderId,
      amount: Math.round(amountRupees * 100),
      expireAfter: 1800,
      paymentFlow: { type: "PG_CHECKOUT", message: `Order ${merchantOrderId}`, merchantUrls: { redirectUrl } },
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.redirectUrl) throw new Error(data?.message || "PhonePe payment creation failed");
  return { orderId: data.orderId as string, redirectUrl: data.redirectUrl as string };
}

export async function phonePeStatus(merchantOrderId: string) {
  const c = await phonepeCreds();
  const res = await fetch(`${c.base}/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status?details=false`, {
    headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${await token()}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "PhonePe status check failed");
  return { state: data.state as "PENDING" | "COMPLETED" | "FAILED", amount: data.amount as number, txnId: data.paymentDetails?.[0]?.transactionId as string | undefined };
}
