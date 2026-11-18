import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allowUser, tooMany } from "@/lib/rate";
import { billingEnabled, createCheckout } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  if (!(await allowUser(supabase, "checkout", 5, 60))) return tooMany();
  if (!billingEnabled()) return NextResponse.json({ error: "A cobrança ainda não está configurada." }, { status: 503 });
  const { data: sub } = await supabase.from("subscriptions").select("provider_customer").maybeSingle();
  try {
    const url = await createCheckout({ userId: auth.user.id, email: auth.user.email, customer: sub?.provider_customer, origin: new URL(request.url).origin });
    return NextResponse.json({ url });
  } catch { return NextResponse.json({ error: "Não foi possível iniciar o pagamento agora." }, { status: 502 }); }
}
