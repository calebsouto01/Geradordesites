// Aceita só links do Google Maps (inclui encurtados); devolve o link limpo ou null.
export function cleanMapsUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    const h = u.hostname.replace(/^www\./, "");
    const ok = h === "maps.app.goo.gl" || h === "goo.gl" || h === "g.page" || h === "share.google" || h === "maps.google.com" || /^google\.[a-z.]+$/.test(h) && u.pathname.startsWith("/maps");
    return ok ? u.toString() : null;
  } catch { return null; }
}
