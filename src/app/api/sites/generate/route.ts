import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContent, makeSlug } from "@/lib/site/generate";
import { fetchPlaceProfile } from "@/lib/site/places";
import type { Profile } from "@/lib/site/types";

const PREVIEW_DAYS = 7;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const leadId = Number(body?.leadId);
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: "Lead inválido." }, { status: 400 });

  const supabase = createClient();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  const { data: existing } = await supabase.from("sites").select("id, slug").eq("lead_id", leadId).maybeSingle();
  if (existing) return NextResponse.json({ site: existing, created: false });

  const base: Profile = lead.profile ?? { name: lead.name, address: lead.address ?? undefined, phone: lead.phone ?? undefined };
  const profile = !lead.profile && lead.place_id ? await fetchPlaceProfile(lead.place_id, base) : base;
  const { content, template } = generateContent(profile);

  // Créditos cobrados no servidor, só depois de gerar com sucesso.
  const { data: remaining, error: creditError } = await supabase.rpc("consume_site", { p_ref: lead.name });
  if (creditError) {
    const no = creditError.message.includes("insufficient_credits");
    return NextResponse.json({ error: no ? "Créditos insuficientes: cada site custa 3." : "Erro ao validar créditos." }, { status: no ? 402 : 500 });
  }

  const { data: site, error } = await supabase.from("sites").insert({
    lead_id: leadId, slug: makeSlug(lead.name), template, content,
    expires_at: new Date(Date.now() + PREVIEW_DAYS * 86400000).toISOString(),
  }).select("id, slug").single();
  if (error) return NextResponse.json({ error: "Erro ao salvar o site." }, { status: 500 });
  return NextResponse.json({ site, created: true, remaining });
}
