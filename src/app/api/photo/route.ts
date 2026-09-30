import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { allow, clientIp } from "@/lib/rate";
import type { SiteRow } from "@/lib/site/types";

const WIDTHS = [480, 900, 1600];

// Entrega a foto do Google sem expor a chave e sem guardar o arquivo (cache curto no navegador/CDN).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const i = Number(url.searchParams.get("i"));
  const w = WIDTHS.includes(Number(url.searchParams.get("w"))) ? Number(url.searchParams.get("w")) : 1600;
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!slug || !Number.isInteger(i) || i < 0 || i > 5 || !key) return new NextResponse(null, { status: 404 });

  const supabase = createAnonClient();
  if (!(await allow(supabase, "photo", clientIp(request), 240, 60))) return new NextResponse(null, { status: 429 });
  const { data } = await supabase.rpc("get_site", { p_slug: slug });
  const photo = (data as SiteRow | null)?.content.photos?.[i];
  if (!photo || !/^places\/[\w-]+\/photos\/[\w-]+$/.test(photo.name)) return new NextResponse(null, { status: 404 });

  const res = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${w}`, { headers: { "X-Goog-Api-Key": key }, redirect: "follow" });
  if (!res.ok) return new NextResponse(null, { status: 404 });
  return new NextResponse(await res.arrayBuffer(), {
    headers: { "Content-Type": res.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
