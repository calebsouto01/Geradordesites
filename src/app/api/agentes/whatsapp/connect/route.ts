import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GRAPH = "https://graph.facebook.com/v21.0";

// Conclui o Cadastro Incorporado: troca o código da Meta por um token, liga o app à conta do WhatsApp do cliente e salva a conexão.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const appId = process.env.NEXT_PUBLIC_META_APP_ID, secret = process.env.WHATSAPP_APP_SECRET;
  if (!appId || !secret) return NextResponse.json({ error: "A conexão com a Meta ainda não está configurada." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const agente_id = Number(body?.agente_id);
  const code = String(body?.code ?? "");
  const phone = String(body?.phone_number_id ?? "");
  const waba = String(body?.waba_id ?? "");
  const resposta = String(body?.resposta_padrao ?? "").trim().slice(0, 1000) || null;
  if (!agente_id || !code) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  if (!/^[0-9]{5,30}$/.test(phone) || !/^[0-9]{5,30}$/.test(waba)) return NextResponse.json({ error: "A Meta não devolveu o número. Conclua todas as etapas na janela e tente de novo." }, { status: 400 });

  const { data: own } = await supabase.from("agentes").select("id").eq("id", agente_id).maybeSingle();
  if (!own) return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });

  const tokenRes = await fetch(`${GRAPH}/oauth/access_token?${new URLSearchParams({ client_id: appId, client_secret: secret, code })}`);
  const tokenJson = await tokenRes.json().catch(() => ({}));
  const token = typeof tokenJson.access_token === "string" ? tokenJson.access_token : "";
  if (!token) return NextResponse.json({ error: "A Meta recusou o código de conexão. Tente de novo." }, { status: 400 });

  // Liga o nosso app (webhook) à conta do WhatsApp do cliente.
  const sub = await fetch(`${GRAPH}/${waba}/subscribed_apps`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  if (!sub.ok) return NextResponse.json({ error: "Não foi possível ativar o recebimento de mensagens nessa conta." }, { status: 502 });

  // Registra o número na Cloud API. Em números conectados por coexistência isso não é necessário, então a falha é ignorada.
  await fetch(`${GRAPH}/${phone}/register`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", pin: String(Math.floor(100000 + Math.random() * 900000)) }),
  }).catch(() => null);

  const row = { phone_number_id: phone, waba_id: waba, access_token: token, resposta_padrao: resposta };
  const { data: existing } = await supabase.from("agente_whatsapp").select("agente_id").eq("agente_id", agente_id).maybeSingle();
  const { error } = existing ? await supabase.from("agente_whatsapp").update(row).eq("agente_id", agente_id) : await supabase.from("agente_whatsapp").insert({ agente_id, ...row });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Esse número já está ligado a outro agente." : "Não foi possível salvar." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
