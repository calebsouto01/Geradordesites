import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContent, makeSlug } from "@/lib/site/generate";
import { writeCopy } from "@/lib/site/copy";
import { applyExtras } from "@/lib/site/sections";
import { themeFromAccent } from "@/lib/site/palette";
import { fetchPlaceProfile } from "@/lib/site/places";
import type { LayoutKey, Profile, Theme } from "@/lib/site/types";

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
  const fetched = !lead.profile && lead.place_id ? await fetchPlaceProfile(lead.place_id, base) : base;
  // Dados revisados pelo usuário na tela de edição têm prioridade sobre os do Google.
  const str = (v: unknown, n: number) => (typeof v === "string" && v.trim() && v.length <= n ? v.trim() : undefined);
  const edit = body?.profile ?? {};
  const profile: Profile = { ...fetched, name: str(edit.name, 120) ?? fetched.name, category: str(edit.category, 80) ?? fetched.category, address: str(edit.address, 200) ?? fetched.address, phone: str(edit.phone, 30) ?? fetched.phone };
  const layout = (["classico", "moderno", "vitrine"] as const).includes(body?.layout) ? (body.layout as LayoutKey) : undefined;
  const gen = generateContent(profile, layout);
  const template = gen.template;
  let content = await writeCopy(profile, gen.content);

  // Itens confirmados no chat de criação (cores, logo, fotos do usuário, serviços e horários).
  const ok = (v: unknown, n: number) => typeof v === "string" && v.length <= n;
  const isUrl = (v: unknown) => ok(v, 500) && /^https:\/\//.test(v as string);
  const sources: Record<string, string> = { ...(content.sources ?? {}) };
  const theme = body?.theme as Partial<Theme> | undefined;
  if (theme && /^#[0-9a-f]{6}$/i.test(theme.accent ?? "")) { content.theme = { ...themeFromAccent(theme.accent!, theme.accent2), ...theme } as typeof content.theme; sources.cores = "informado pelo usuário"; }
  if (isUrl(body?.logoUrl)) content.logoUrl = body.logoUrl;
  if (Array.isArray(body?.extraPhotos))
    content.photos = [...(content.photos ?? []), ...body.extraPhotos.filter(isUrl).slice(0, 6).map((url: string) => ({ name: "", url, width: 0, height: 0, author: "Enviada pelo cliente" }))];
  if (Array.isArray(body?.servicos) && body.servicos.length) {
    content.services = { ...content.services, items: body.servicos.slice(0, 6).filter((x: { title?: unknown; text?: unknown }) => ok(x.title, 80) && ok(x.text, 200)).map((x: { title: string; text: string }) => ({ title: x.title, text: x.text })) };
    sources.servicos = "informado pelo usuário";
  }
  if (Array.isArray(body?.horarios) && body.horarios.length) content = { ...content, hours: body.horarios.slice(0, 7).filter((h: unknown) => ok(h, 80)) };
  if (ok(body?.about, 600) && body.about.trim()) { content.about = { ...content.about, text: body.about.trim() }; sources.sobre = "informado pelo usuário"; }
  content = applyExtras(content, body?.extras);
  content.sources = sources;

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
