import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allow, tooMany } from "@/lib/rate";
import { fetchPlaceProfile } from "@/lib/site/places";
import type { Profile } from "@/lib/site/types";

// Devolve o perfil do negócio (Google, caso de teste ou dados manuais) para preencher a tela de edição.
export async function GET(request: Request) {
  const leadId = Number(new URL(request.url).searchParams.get("leadId"));
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: "Lead inválido." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  if (!(await allow(supabase, "prefill", auth.user.id, 30, 60))) return tooMany();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  const base: Profile = lead.profile ?? { name: lead.name, address: lead.address ?? undefined, phone: lead.phone ?? undefined };
  const profile = !lead.profile && lead.place_id ? await fetchPlaceProfile(lead.place_id, base) : base;
  return NextResponse.json({ profile });
}
