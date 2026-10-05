"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NODES_1, NODES_2, SHARED } from "@/lib/scripts/data";

type Call = { id: number; lead_id: number | null; script: number; objections: string[]; outcome: string; created_at: string };
type Lead = { id: number; stage: string; next_contact: string | null };
type Row = { label: string; value: number; note?: string };

const OUTCOME: Record<string, string> = { falou_dono: "Falou com o dono", atendente: "Falou com atendente", nao_atendeu: "Não atendeu", retorno: "Pediu retorno" };
const objLabel = (id: string) => (NODES_1[id] ?? NODES_2[id] ?? SHARED[id])?.title.replace(/[“”"]/g, "") ?? id;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// Barras horizontais: uma cor para categorias sem ordem; rampa (cls) só quando as linhas são etapas ordenadas.
function Bars({ rows, ramp, empty }: { rows: Row[]; ramp?: boolean; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.some((r) => r.value > 0)) return <p className="mut" style={{ margin: "12px 0 0" }}>{empty}</p>;
  return (
    <div className="fun">
      {rows.map((r, i) => (
        <div key={r.label} className="orow" title={`${r.label}: ${r.value}${r.note ? ` · ${r.note}` : ""}`}>
          <span>{r.label}</span>
          <div className="ftrack"><div className={`fbar ${ramp ? `s${i}` : "one"}`} style={{ width: `${(r.value / max) * 100}%` }} /></div>
          <b>{r.value}</b>
          {r.note && <span className="mut">{r.note}</span>}
        </div>
      ))}
    </div>
  );
}

function Table({ rows, head }: { rows: Row[]; head: string }) {
  return (
    <table className="vtable">
      <thead><tr><th>{head}</th><th>Total</th><th /></tr></thead>
      <tbody>{rows.map((r) => <tr key={r.label}><td>{r.label}</td><td>{r.value}</td><td className="mut">{r.note}</td></tr>)}</tbody>
    </table>
  );
}

export default function Operador() {
  const supabase = createClient();
  const [calls, setCalls] = useState<Call[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sitesByLead, setSitesByLead] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [table, setTable] = useState(false);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [{ data: c }, { data: l }, { data: s }] = await Promise.all([
        supabase.from("calls").select("id, lead_id, script, objections, outcome, created_at").gte("created_at", since).order("created_at"),
        supabase.from("leads").select("id, stage, next_contact"),
        supabase.from("sites").select("lead_id"),
      ]);
      setCalls((c as Call[]) ?? []); setLeads((l as Lead[]) ?? []);
      setSitesByLead(new Set(((s as { lead_id: number }[]) ?? []).map((x) => x.lead_id)));
      setLoaded(true);
    })();
  }, [supabase]);

  const d = useMemo(() => {
    const today = dayKey(new Date());
    const week = Date.now() - 7 * 86400000;
    const owner = calls.filter((c) => c.outcome === "falou_dono").length;
    const days = Array.from({ length: 14 }, (_, i) => dayKey(new Date(Date.now() - (13 - i) * 86400000)));
    const perDay = days.map((k) => ({ day: k, n: calls.filter((c) => c.created_at.slice(0, 10) === k).length }));
    const outcomes: Row[] = Object.keys(OUTCOME).map((k) => ({ label: OUTCOME[k], value: calls.filter((c) => c.outcome === k).length }));
    const objCount: Record<string, number> = {};
    calls.forEach((c) => c.objections.forEach((o) => (objCount[o] = (objCount[o] ?? 0) + 1)));
    const objections: Row[] = Object.entries(objCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, n]) => ({ label: objLabel(id), value: n }));
    const scripts: Row[] = [1, 2].map((k) => {
      const all = calls.filter((c) => c.script === k);
      const won = all.filter((c) => c.outcome === "falou_dono").length;
      return { label: `Opção ${k}`, value: all.length ? Math.round((won / all.length) * 100) : 0, note: `${won} de ${all.length} ligações falaram com o dono` };
    });
    const called = new Set(calls.map((c) => c.lead_id));
    const stage = (ids: string[]) => leads.filter((l) => ids.includes(l.stage)).length;
    const reached = leads.filter((l) => l.stage !== "novo" || calls.some((c) => c.lead_id === l.id && c.outcome === "falou_dono")).length;
    const chain: Row[] = [
      { label: "Leads ligados", value: called.size },
      { label: "Falaram com o dono", value: reached },
      { label: "Site gerado", value: leads.filter((l) => sitesByLead.has(l.id)).length },
      { label: "Proposta encaminhada", value: stage(["proposta_enviada", "fechado"]) },
      { label: "Venda fechada", value: stage(["fechado"]) },
    ];
    return {
      total: calls.length, today: calls.filter((c) => c.created_at.slice(0, 10) === today).length,
      week: calls.filter((c) => new Date(c.created_at).getTime() >= week).length,
      rate: calls.length ? Math.round((owner / calls.length) * 100) : null,
      returns: leads.filter((l) => l.next_contact && l.next_contact >= today && !["fechado", "perdido"].includes(l.stage)).length,
      perDay, maxDay: Math.max(1, ...perDay.map((x) => x.n)), outcomes, objections, scripts, chain,
    };
  }, [calls, leads, sitesByLead]);

  return (
    <div className="viz">
      <div className="pagehead">
        <h1>Operador</h1>
        <span className="mut">Seu desempenho nas ligações, nos últimos 30 dias.</span>
        <div className="row" style={{ marginTop: 10 }}>
          <Link href="/funil"><button className="sm">▦ Ir para o funil</button></Link>
          <button className="ghost sm" onClick={() => setTable((t) => !t)}>{table ? "Ver gráficos" : "Ver tabelas"}</button>
        </div>
      </div>

      {loaded && !d.total ? (
        <div className="panel"><p style={{ margin: 0 }}>Nenhuma ligação registrada ainda. No <Link href="/funil">funil</Link>, clique em <b>Entrar em contato</b> num lead, siga a árvore e registre o resultado: o painel se preenche sozinho.</p></div>
      ) : (
        <>
          <div className="kpis">
            <div className="stat hero">
              <div className="mut">Ligações nos últimos 7 dias</div>
              <div className="big">{d.week}</div>
              <div className="mut">{d.today} hoje · {d.total} em 30 dias</div>
            </div>
            <div className="stat"><div className="mut">Falaram com o dono</div><div className="n">{d.rate === null ? "—" : `${d.rate}%`}</div></div>
            <div className="stat"><div className="mut">Retornos agendados</div><div className="n">{d.returns}</div></div>
          </div>

          <div className="panel" style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Ligações por dia</h2>
            {table ? (
              <Table head="Dia" rows={d.perDay.map((x) => ({ label: new Date(x.day + "T00:00").toLocaleDateString("pt-BR"), value: x.n }))} />
            ) : (
              <div className="cols" role="img" aria-label="Ligações por dia, últimos 14 dias">
                {d.perDay.map((x) => (
                  <div key={x.day} className="colbar" title={`${new Date(x.day + "T00:00").toLocaleDateString("pt-BR")}: ${x.n} ligação(ões)`}>
                    <span className="mut">{x.n || ""}</span>
                    <div className="colwrap"><div className="colfill" style={{ height: `${(x.n / d.maxDay) * 100}%` }} /></div>
                    <span className="mut">{x.day.slice(8)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="twocol">
            <div className="panel">
              <h2 style={{ fontSize: 16, margin: 0 }}>Resultado das ligações</h2>
              {table ? <Table head="Resultado" rows={d.outcomes} /> : <Bars rows={d.outcomes} empty="Sem ligações." />}
            </div>
            <div className="panel">
              <h2 style={{ fontSize: 16, margin: 0 }}>Objeções mais frequentes</h2>
              {table ? <Table head="Objeção" rows={d.objections} /> : <Bars rows={d.objections} empty="Nenhuma objeção registrada: elas aparecem quando você passa por elas na árvore." />}
            </div>
          </div>

          <div className="twocol" style={{ marginTop: 22 }}>
            <div className="panel">
              <h2 style={{ fontSize: 16, margin: 0 }}>Da ligação à venda</h2>
              {table ? <Table head="Etapa" rows={d.chain} /> : <Bars rows={d.chain} ramp empty="Sem dados." />}
            </div>
            <div className="panel">
              <h2 style={{ fontSize: 16, margin: 0 }}>Modelo que mais chega ao dono (%)</h2>
              {table ? <Table head="Modelo" rows={d.scripts} /> : <Bars rows={d.scripts} empty="Sem ligações." />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
