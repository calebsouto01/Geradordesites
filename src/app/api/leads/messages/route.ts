import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allowUser, tooMany } from "@/lib/rate";
import { writeLeadMessages } from "@/lib/site/leadMessages";

// Mensagens e abertura de ligação personalizadas para um lead (1 crédito, cobrado só se a IA responder).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const leadId = Number(body?.leadId);
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: "Lead inválido." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  if (!(await allowUser(supabase, "leadmsg", 10, 60))) return tooMany();
  const { data: lead } = await supabase.from("leads").select("id, name, address, profile, messages").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
  if (lead.messages && body?.regenerate !== true) return NextResponse.json({ messages: lead.messages, charged: false });

  const { data: left } = await supabase.rpc("credits_remaining");
  if ((left ?? 0) < 1) return NextResponse.json({ error: "Créditos insuficientes: as mensagens custam 1." }, { status: 402 });

  const p = (lead.profile ?? {}) as { category?: string; rating?: number; ratingCount?: number; address?: string; reviews?: { text: string }[]; prospeccao?: { observacao?: string } };
  const messages = await writeLeadMessages({
    name: lead.name, category: p.category, rating: p.rating, ratingCount: p.ratingCount, address: p.address ?? lead.address ?? undefined,
    observacao: p.prospeccao?.observacao, reviews: (p.reviews ?? []).slice(0, 6).map((r) => r.text),
  });
  if (!messages) return NextResponse.json({ error: "Não foi possível gerar as mensagens agora. Nada foi cobrado." }, { status: 503 });

  const { data: remaining, error } = await supabase.rpc("consume_messages", { p_ref: lead.name });
  if (error) return NextResponse.json({ error: error.message.includes("insufficient_credits") ? "Créditos insuficientes: as mensagens custam 1." : "Erro ao validar créditos." }, { status: error.message.includes("insufficient_credits") ? 402 : 500 });
  await supabase.from("leads").update({ messages }).eq("id", leadId);
  return NextResponse.json({ messages, charged: true, remaining });
}
