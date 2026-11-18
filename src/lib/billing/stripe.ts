import { createHmac, timingSafeEqual } from "crypto";

const API = "https://api.stripe.com/v1";

export const billingEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);

const body = (o: Record<string, string | undefined>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined) as [string, string][]);

async function call(path: string, params?: Record<string, string | undefined>, method: "GET" | "POST" = "POST") {
  const res = await fetch(`${API}${path}`, {
    method, headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    body: params ? body(params) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Stripe ${res.status}`);
  return json;
}

export async function createCheckout(o: { userId: string; email?: string; customer?: string | null; origin: string }) {
  const s = await call("/checkout/sessions", {
    mode: "subscription", "line_items[0][price]": process.env.STRIPE_PRICE_ID, "line_items[0][quantity]": "1",
    client_reference_id: o.userId, customer: o.customer ?? undefined, customer_email: o.customer ? undefined : o.email,
    success_url: `${o.origin}/plano?ok=1`, cancel_url: `${o.origin}/plano`, allow_promotion_codes: "true", locale: "pt-BR",
  });
  return s.url as string;
}

export async function createPortal(o: { customer: string; origin: string }) {
  const s = await call("/billing_portal/sessions", { customer: o.customer, return_url: `${o.origin}/plano` });
  return s.url as string;
}

export const getSubscription = (id: string) => call(`/subscriptions/${encodeURIComponent(id)}`, undefined, "GET");

// Confere a assinatura do webhook (t=...,v1=...) com tolerância de 5 minutos.
export function verifySignature(raw: string, header: string | null, secret: string, nowSec = Date.now() / 1000, tolerance = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(nowSec - t) > tolerance) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const given = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  return given.some((g) => g.length === expected.length && timingSafeEqual(Buffer.from(g), Buffer.from(expected)));
}

export const mapStatus = (s: string): "active" | "past_due" | "canceled" => (s === "active" || s === "trialing" ? "active" : s === "past_due" || s === "unpaid" ? "past_due" : "canceled");

export function periodEnd(sub: { current_period_end?: number; items?: { data?: { current_period_end?: number }[] } }) {
  const t = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return t ? new Date(t * 1000).toISOString() : null;
}
