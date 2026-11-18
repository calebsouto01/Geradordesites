import { fetchPlaceProfile } from "./places";
import type { Profile } from "./types";

// Hosts permitidos em cada salto do redirecionamento (evita seguir links para fora do Google).
const HOST_OK = /^(www\.)?(share\.google|maps\.app\.goo\.gl|goo\.gl|g\.page|maps\.google\.[a-z.]+|google\.[a-z.]+)$/;

export type Resolved = { finalUrl: string; name?: string; lat?: number; lng?: number; placeId?: string };

async function follow(url: string): Promise<string> {
  let cur = url;
  for (let i = 0; i < 6; i++) {
    const u = new URL(cur);
    if (!HOST_OK.test(u.hostname)) break;
    const res = await fetch(cur, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (compatible; GeradorDeSites/1.0)", "Accept-Language": "pt-BR,pt;q=0.9" }, signal: AbortSignal.timeout(8000) });
    const loc = res.headers.get("location");
    if (!loc || res.status < 300 || res.status > 399) break;
    cur = new URL(loc, cur).toString();
  }
  return cur;
}

// Lê nome, coordenadas e ID do lugar a partir do endereço final do link.
export function parseMapsUrl(finalUrl: string): Resolved {
  const out: Resolved = { finalUrl };
  let u: URL;
  try { u = new URL(finalUrl); } catch { return out; }
  const full = decodeURIComponent(u.pathname + u.search + u.hash).replace(/\+/g, " ");
  const place = u.pathname.match(/\/maps\/place\/([^/@]+)/);
  if (place) out.name = decodeURIComponent(place[1]).replace(/\+/g, " ");
  const q = u.searchParams.get("q") ?? u.searchParams.get("query");
  if (!out.name && q && !/^place_id:/.test(q)) out.name = q;
  const pid = (q?.match(/^place_id:(.+)$/)?.[1]) ?? u.searchParams.get("query_place_id") ?? full.match(/(ChIJ[\w-]{20,})/)?.[1];
  if (pid) out.placeId = pid;
  const at = full.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ?? full.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (at) { out.lat = Number(at[1]); out.lng = Number(at[2]); }
  return out;
}

async function findPlaceId(r: Resolved): Promise<string | undefined> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !r.name) return undefined;
  const body: Record<string, unknown> = { textQuery: r.name, languageCode: "pt-BR", maxResultCount: 1 };
  if (r.lat !== undefined && r.lng !== undefined) body.locationBias = { circle: { center: { latitude: r.lat, longitude: r.lng }, radius: 500 } };
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return undefined;
  const j = await res.json();
  return j.places?.[0]?.id;
}

// Link do Maps (inclusive encurtado) -> dados do negócio. Sem chave do Google, devolve só o que o link traz (nome).
export async function resolveMapsLink(url: string): Promise<{ profile: Profile | null; resolved: Resolved; full: boolean }> {
  const resolved = parseMapsUrl(await follow(url));
  const placeId = resolved.placeId ?? (await findPlaceId(resolved));
  if (placeId && process.env.GOOGLE_PLACES_API_KEY) {
    const p = await fetchPlaceProfile(placeId, { name: resolved.name ?? "" });
    if (p.name) return { profile: p, resolved, full: true };
  }
  return { profile: resolved.name ? { name: resolved.name } : null, resolved, full: false };
}
