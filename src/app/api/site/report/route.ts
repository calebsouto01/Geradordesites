import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase/anon";
import { allowIp, tooMany } from "@/lib/rate";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slug = String(body?.slug ?? "").slice(0, 80), reason = String(body?.reason ?? ""), contact = String(body?.contact ?? "");
  if (!slug || reason.trim().length < 5) return NextResponse.json({ error: "Descreva o motivo da denúncia." }, { status: 400 });
  const supabase = createAnonClient();
  if (!(await allowIp(supabase, "report", request, 5, 3600))) return tooMany();
  const { data } = await supabase.rpc("submit_report", { p_slug: slug, p_reason: reason, p_contact: contact });
  return data ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Não foi possível enviar agora." }, { status: 400 });
}
