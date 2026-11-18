import { createClient } from "@/lib/supabase/server";
import PlanActions from "./PlanActions";

export const dynamic = "force-dynamic";

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STATUS: Record<string, string> = { active: "Ativa", trialing: "Em teste", past_due: "Pagamento pendente", canceled: "Cancelada" };

export default async function Plano({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const supabase = await createClient();
  const [{ data: plan }, { data: sub }, { data: credits }, { data: ledger }, { data: profile }] = await Promise.all([
    supabase.from("plans").select("*").eq("id", "inicial").single(),
    supabase.from("subscriptions").select("*").maybeSingle(),
    supabase.rpc("credits_remaining"),
    supabase.from("credit_ledger").select("kind, cost, ref, created_at").order("created_at", { ascending: false }).limit(15),
    supabase.from("profiles").select("trial_credits").maybeSingle(),
  ]);
  const active = sub && ["active", "trialing", "past_due"].includes(sub.status);
  const ok = (await searchParams).ok;

  return (
    <>
      <div className="pagehead"><h1>Plano e créditos</h1><span className="mut">Seu plano, saldo e histórico de uso.</span></div>
      {ok && <p className="ok">Obrigado! Assim que o pagamento for confirmado, seus créditos são liberados.</p>}

      <div className="stats">
        <div className="stat"><div className="mut">Créditos restantes</div><div className="n">{credits ?? 0}</div></div>
        <div className="stat"><div className="mut">Plano</div><div className="n" style={{ fontSize: 18 }}>{active ? plan?.name : "Teste grátis"}</div></div>
        <div className="stat"><div className="mut">Situação</div><div className="n" style={{ fontSize: 18 }}>{sub ? STATUS[sub.status] : `${profile?.trial_credits ?? 6} créditos de teste`}</div></div>
        {active && sub?.current_period_end && <div className="stat"><div className="mut">Renova em</div><div className="n" style={{ fontSize: 18 }}>{new Date(sub.current_period_end).toLocaleDateString("pt-BR")}</div></div>}
      </div>

      <div className="panel" style={{ marginBottom: 22, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ fontSize: 18 }}>{plan?.name ?? "Plano Inicial"} · {plan ? brl(plan.price_cents) : "R$ 49,90"}/mês</h2>
          <p className="mut" style={{ margin: 0 }}>{plan?.credits ?? 45} créditos por mês. Cada busca custa 3 créditos e cada site gerado custa 3 créditos. Os créditos renovam todo mês.</p>
        </div>
        <PlanActions hasSub={Boolean(sub?.provider_customer)} />
      </div>

      <h2 style={{ fontSize: 16 }}>Últimos usos</h2>
      <div className="panel">
        {ledger?.length ? (
          <ul className="rev">
            {ledger.map((l, i) => (
              <li key={i}><span>{l.kind === "site" ? "Site gerado" : "Busca"} <span className="mut">· {l.ref}</span></span><b>−{l.cost} · {new Date(l.created_at).toLocaleDateString("pt-BR")}</b></li>
            ))}
          </ul>
        ) : <p className="mut" style={{ margin: 0 }}>Nenhum uso ainda.</p>}
      </div>
    </>
  );
}
