import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { allowUser, tooMany } from "@/lib/rate";
import { systemPrompt } from "@/lib/agentes/prompt";

type Msg = { role: "user" | "assistant"; text: string };

// Teste do agente: conversa de simulação, sem enviar nada ao WhatsApp.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  if (!(await allowUser(supabase, "agente_chat", 30, 60))) return tooMany();

  const body = await request.json().catch(() => null);
  const id = Number(body?.agente_id);
  const messages: Msg[] = Array.isArray(body?.messages) ? body.messages.slice(-20) : [];
  if (!id || !messages.length) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { data: agente } = await supabase.from("agentes").select("nome, empresa, tom, instrucoes, conhecimento").eq("id", id).maybeSingle();
  if (!agente) return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ reply: "A chave da IA (ANTHROPIC_API_KEY) ainda não está configurada no servidor." });

  const list = messages.map((m) => ({ role: m.role, content: String(m.text).slice(0, 2000) }));
  while (list.length && list[0].role !== "user") list.shift();
  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({ model: "claude-sonnet-5-5", max_tokens: 500, system: systemPrompt(agente), messages: list });
    const text = res.content.find((b) => b.type === "text");
    return NextResponse.json({ reply: text && "text" in text ? text.text : "Não consegui responder agora." });
  } catch {
    return NextResponse.json({ reply: "A IA não respondeu agora. Tente de novo em instantes." });
  }
}
