import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { billingEnabled, createPortal } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  if (!billingEnabled()) return NextResponse.json({ error: "A cobrança ainda não está configurada." }, { status: 503 });
  const { data: sub } = await supabase.from("subscriptions").select("provider_customer").maybeSingle();
  if (!sub?.provider_customer) return NextResponse.json({ error: "Você ainda não tem assinatura." }, { status: 400 });
  try { return NextResponse.json({ url: await createPortal({ customer: sub.provider_customer, origin: new URL(request.url).origin }) }); }
  catch { return NextResponse.json({ error: "Não foi possível abrir o portal agora." }, { status: 502 }); }
}
