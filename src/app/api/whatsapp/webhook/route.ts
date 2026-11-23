import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText, verifySignature } from "@/lib/agentes/whatsapp";
import { systemPrompt } from "@/lib/agentes/prompt";

// Webhook do WhatsApp Cloud API. Exige WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET e SUPABASE_SERVICE_ROLE_KEY.

// Verificação inicial feita pela Meta ao cadastrar o webhook.
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === token) {
    return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

type WaMessage = { id: string; from: string; type: string; text?: { body?: string } };

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_APP_SECRET, admin = createAdminClient();
  if (!secret || !admin) return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"), secret)) return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });

  let payload: { entry?: { changes?: { value?: { metadata?: { phone_number_id?: string }; messages?: WaMessage[] } }[] }[] };
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "Corpo inválido." }, { status: 400 }); }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const phoneId = change.value?.metadata?.phone_number_id;
      if (!phoneId) continue;
      const { data: conn } = await admin.from("agente_whatsapp").select("agente_id, user_id, access_token, resposta_padrao, ativo").eq("phone_number_id", phoneId).maybeSingle();
      if (!conn || !conn.ativo) continue;
      const { data: agente } = await admin.from("agentes").select("nome, empresa, tom, instrucoes, conhecimento, ativo").eq("id", conn.agente_id).maybeSingle();
      if (!agente || !agente.ativo) continue;

      for (const m of change.value?.messages ?? []) {
        const incoming = m.type === "text" ? (m.text?.body ?? "").slice(0, 2000) : "";
        // wamid único: a Meta reenvia eventos; só processa uma vez.
        const { error: dup } = await admin.from("whatsapp_mensagens").insert({ user_id: conn.user_id, agente_id: conn.agente_id, contato: m.from, direcao: "entrada", texto: incoming || `[${m.type}]`, wamid: m.id });
        if (dup) continue;
        if (!incoming) { await reply(admin, conn, phoneId, m.from, "Por enquanto só consigo ler mensagens de texto. Pode escrever sua dúvida?"); continue; }

        const { data: hist } = await admin.from("whatsapp_mensagens").select("direcao, texto").eq("agente_id", conn.agente_id).eq("contato", m.from).order("created_at", { ascending: false }).limit(10);
        const msgs = (hist ?? []).reverse().map((h) => ({ role: h.direcao === "entrada" ? ("user" as const) : ("assistant" as const), content: h.texto }));
        await reply(admin, conn, phoneId, m.from, await answer(agente, msgs, conn.resposta_padrao));
      }
    }
  }
  return NextResponse.json({ received: true });
}

async function reply(admin: NonNullable<ReturnType<typeof createAdminClient>>, conn: { agente_id: number; user_id: string; access_token: string }, phoneId: string, to: string, text: string) {
  if (await sendText(phoneId, conn.access_token, to, text)) {
    await admin.from("whatsapp_mensagens").insert({ user_id: conn.user_id, agente_id: conn.agente_id, contato: to, direcao: "saida", texto: text });
  }
}

// Sem chave da IA, responde com a mensagem padrão configurada (ou um aviso genérico).
async function answer(agente: { nome: string; empresa: string | null; tom: string; instrucoes: string | null; conhecimento: string | null }, msgs: { role: "user" | "assistant"; content: string }[], fallback: string | null) {
  const standard = fallback || "Olá! Recebemos sua mensagem e um atendente vai responder em breve.";
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return standard;
  const list = [...msgs];
  while (list.length && list[0].role !== "user") list.shift();
  if (!list.length) return standard;
  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({ model: "claude-sonnet-5-5", max_tokens: 500, system: systemPrompt(agente), messages: list });
    const t = res.content.find((b) => b.type === "text");
    return t && "text" in t && t.text ? t.text : standard;
  } catch { return standard; }
}
