import { createHmac, timingSafeEqual } from "node:crypto";

const GRAPH = "https://graph.facebook.com/v21.0";

// Confere a assinatura X-Hub-Signature-256 enviada pela Meta (HMAC-SHA256 do corpo com o App Secret).
export function verifySignature(raw: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  const given = Buffer.from(header.slice(7), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Devolve ok ou o motivo da recusa da Meta (sem expor o token).
export async function sendText(phoneNumberId: string, token: string, to: string, body: string): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: body.slice(0, 4000) } }),
    });
    if (res.ok) return { ok: true };
    const j = await res.json().catch(() => ({}));
    const e = j?.error as { message?: string; code?: number } | undefined;
    return { ok: false, erro: `Meta ${res.status}${e?.code ? ` (código ${e.code})` : ""}: ${e?.message ?? "envio recusado"}`.slice(0, 300) };
  } catch {
    return { ok: false, erro: "Não foi possível falar com a Meta." };
  }
}
