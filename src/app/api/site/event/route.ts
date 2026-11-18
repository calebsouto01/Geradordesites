import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { allowIp } from "@/lib/rate";

// Registra visualização e cliques do cliente final. O banco ainda impõe um teto por site.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slug = String(body?.slug ?? ""), kind = String(body?.kind ?? "");
  if (!/^[a-z0-9-]{3,60}$/.test(slug) || !["view", "whatsapp", "mapa"].includes(kind)) return new NextResponse(null, { status: 204 });
  const supabase = createAnonClient();
  if (await allowIp(supabase, "event", request, 60, 60)) await supabase.rpc("record_event", { p_slug: slug, p_kind: kind });
  return new NextResponse(null, { status: 204 });
}
