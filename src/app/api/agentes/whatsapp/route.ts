import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Salva/remove a conexão do agente com o WhatsApp. O token é gravado aqui e nunca devolvido ao navegador.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const agente_id = Number(body?.agente_id);
  const phone = String(body?.phone_number_id ?? "").trim();
  const token = String(body?.access_token ?? "").trim();
  const resposta = String(body?.resposta_padrao ?? "").trim().slice(0, 1000) || null;
  if (!agente_id || !/^[0-9]{5,30}$/.test(phone)) return NextResponse.json({ error: "Informe o ID do número de telefone (somente números)." }, { status: 400 });

  const { data: own } = await supabase.from("agentes").select("id").eq("id", agente_id).maybeSingle();
  if (!own) return NextResponse.json({ error: "Agente não encontrado." }, { status: 404 });

  const { data: existing } = await supabase.from("agente_whatsapp").select("agente_id").eq("agente_id", agente_id).maybeSingle();
  if (!existing && !token) return NextResponse.json({ error: "Informe o token de acesso." }, { status: 400 });
  const row = { phone_number_id: phone, resposta_padrao: resposta, ...(token ? { access_token: token } : {}) };
  const { error } = existing
    ? await supabase.from("agente_whatsapp").update(row).eq("agente_id", agente_id)
    : await supabase.from("agente_whatsapp").insert({ agente_id, ...row, access_token: token });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Esse número já está ligado a outro agente." : "Não foi possível salvar." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("agente_id"));
  if (!id) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  await supabase.from("agente_whatsapp").delete().eq("agente_id", id);
  return NextResponse.json({ ok: true });
}
