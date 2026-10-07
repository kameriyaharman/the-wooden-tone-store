import "server-only";
import crypto from "crypto";
const secret = () => process.env.AUTH_SECRET || "insecure-dev-secret-please-set-AUTH_SECRET";
export const orderToken = (orderNo: string) => crypto.createHmac("sha256", secret()).update("order:" + orderNo).digest("hex").slice(0, 24);
export const checkOrderToken = (orderNo: string, k?: string | null) => !!k && k === orderToken(orderNo);
export const siteUrl = () => (process.env.SITE_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "http://localhost:3000")).replace(/\/$/, "");
