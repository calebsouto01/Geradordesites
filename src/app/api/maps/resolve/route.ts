import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allowUser, tooMany } from "@/lib/rate";
import { cleanMapsUrl } from "@/lib/site/maps";
import { resolveMapsLink } from "@/lib/site/mapsResolve";

// Recebe um link do Google Maps e devolve os dados do negócio para preencher o cadastro.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  if (!(await allowUser(supabase, "mapsresolve", 12, 60))) return tooMany();
  const body = await request.json().catch(() => null);
  const url = cleanMapsUrl(String(body?.url ?? ""));
  if (!url) return NextResponse.json({ error: "O link precisa ser do Google Maps." }, { status: 400 });
  try {
    const { profile, resolved, full } = await resolveMapsLink(url);
    if (!profile) return NextResponse.json({ error: "Não consegui ler esse link. Preencha os dados manualmente." }, { status: 422 });
    return NextResponse.json({ profile, full, mapsUrl: profile.mapsUrl ?? resolved.finalUrl });
  } catch {
    return NextResponse.json({ error: "Não consegui abrir esse link. Preencha os dados manualmente." }, { status: 422 });
  }
}
