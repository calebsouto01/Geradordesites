import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { allowIp } from "@/lib/rate";

// Mensagem do formulário do site. Limite por IP aqui e por site no banco; campo "website" é armadilha para robôs.
export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  const slug = String(b?.slug ?? ""), name = String(b?.name ?? "").trim(), phone = String(b?.phone ?? ""), message = String(b?.message ?? "");
  if (b?.website) return NextResponse.json({ ok: true }); // robô: finge sucesso, não grava
  if (!/^[a-z0-9-]{3,60}$/.test(slug) || name.length < 2) return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
  const supabase = createAnonClient();
  if (!(await allowIp(supabase, "lead", request, 5, 3600))) return NextResponse.json({ error: "Muitas mensagens em pouco tempo. Tente mais tarde." }, { status: 429 });
  const { data } = await supabase.rpc("submit_site_lead", { p_slug: slug, p_name: name, p_phone: phone, p_message: message });
  return data ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Não foi possível enviar agora." }, { status: 400 });
}
