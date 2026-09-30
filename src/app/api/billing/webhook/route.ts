import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscription, mapStatus, periodEnd, verifySignature } from "@/lib/billing/stripe";

// Webhook do Stripe: atualiza a assinatura do usuário. Exige STRIPE_WEBHOOK_SECRET e SUPABASE_SERVICE_ROLE_KEY.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET, admin = createAdminClient();
  if (!secret || !admin) return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("stripe-signature"), secret)) return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });

  const event = JSON.parse(raw) as { type: string; data: { object: Record<string, unknown> } };
  const obj = event.data.object as { id: string; client_reference_id?: string; customer?: string; subscription?: string; status?: string; current_period_end?: number; items?: { data?: { current_period_end?: number }[] } };
  try {
    if (event.type === "checkout.session.completed" && obj.client_reference_id && obj.subscription) {
      const sub = await getSubscription(obj.subscription);
      await admin.from("subscriptions").upsert({
        user_id: obj.client_reference_id, plan_id: "inicial", status: mapStatus(sub.status), provider: "stripe", provider_customer: obj.customer, provider_subscription: obj.subscription,
        current_period_end: periodEnd(sub), updated_at: new Date().toISOString(),
      });
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await admin.from("subscriptions").update({
        status: event.type.endsWith("deleted") ? "canceled" : mapStatus(obj.status ?? ""), current_period_end: periodEnd(obj), updated_at: new Date().toISOString(),
      }).eq("provider_subscription", obj.id);
    }
  } catch { return NextResponse.json({ error: "Falha ao processar." }, { status: 500 }); }
  return NextResponse.json({ received: true });
}
