import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SiteRow } from "@/lib/site/types";

// Entrega a foto do Google sem expor a chave e sem guardar o arquivo (cache curto no navegador/CDN).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") ?? "";
  const i = Number(url.searchParams.get("i"));
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!slug || !Number.isInteger(i) || i < 0 || i > 5 || !key) return new NextResponse(null, { status: 404 });

  const { data } = await createClient().rpc("get_site", { p_slug: slug });
  const photo = (data as SiteRow | null)?.content.photos?.[i];
  if (!photo || !/^places\/[\w-]+\/photos\/[\w-]+$/.test(photo.name)) return new NextResponse(null, { status: 404 });

  const res = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1600&maxHeightPx=1200`, { headers: { "X-Goog-Api-Key": key }, redirect: "follow" });
  if (!res.ok) return new NextResponse(null, { status: 404 });
  return new NextResponse(await res.arrayBuffer(), {
    headers: { "Content-Type": res.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  });
}
