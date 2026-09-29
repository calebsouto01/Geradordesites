"use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAGES = [
  ["novo", "Novo", "#6366f1"], ["contato_iniciado", "Contato iniciado", "#38bdf8"],
  ["qualificado", "Qualificado", "#a78bfa"], ["proposta_enviada", "Proposta enviada", "#f59e0b"],
  ["negociacao", "Negociação", "#fb923c"], ["fechado", "Fechado — Cliente", "#22c55e"],
  ["perdido", "Perdido", "#ef4444"],
] as const;

type Lead = {
  id: number; name: string; phone: string | null; origin: string; stage: string;
  estimated_value: number | null; owner: string | null; next_contact: string | null; lost_reason: string | null;
};

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function contactBadge(date: string | null) {
  if (!date) return null;
  const days = Math.floor((new Date(date + "T00:00").getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
  const label = new Date(date + "T00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  if (days < 0) return <span className="badge late">Atrasado · {label}</span>;
  if (days <= 2) return <span className="badge soon">Retomar · {label}</span>;
  return <span className="badge" style={{ background: "transparent", color: "var(--mut)", borderColor: "var(--line2)" }}>{label}</span>;
}

export default function Funil() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [over, setOver] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("leads").select("*").order("created_at").then(({ data }) => {
      setLeads((data as Lead[]) ?? []);
      setLoaded(true);
    });
  }, [supabase]);

  async function patch(id: number, changes: Partial<Lead>) {
    setLeads((l) => l.map((x) => (x.id === id ? { ...x, ...changes } : x)));
    await supabase.from("leads").update(changes).eq("id", id);
  }

  const stats = useMemo(() => {
    const active = leads.filter((l) => !["fechado", "perdido"].includes(l.stage));
    const won = leads.filter((l) => l.stage === "fechado");
    const sum = (a: Lead[]) => a.reduce((s, l) => s + (l.estimated_value ?? 0), 0);
    const closed = won.length + leads.filter((l) => l.stage === "perdido").length;
    return {
      active: active.length, pipeline: sum(active), won: sum(won),
      rate: closed ? Math.round((won.length / closed) * 100) : null,
    };
  }, [leads]);

  return (
    <>
      <div className="pagehead">
        <h1>Funil de vendas</h1>
        <span className="mut">Arraste os cards entre as etapas ou use o menu do card.</span>
      </div>

      <div className="stats">
        <div className="stat"><div className="mut">Leads ativos</div><div className="n">{stats.active}</div></div>
        <div className="stat"><div className="mut">Valor em aberto</div><div className="n">{brl(stats.pipeline)}</div></div>
        <div className="stat"><div className="mut">Vendas fechadas</div><div className="n" style={{ color: "var(--ok)" }}>{brl(stats.won)}</div></div>
        <div className="stat"><div className="mut">Taxa de fechamento</div><div className="n">{stats.rate === null ? "—" : `${stats.rate}%`}</div></div>
      </div>

      {loaded && !leads.length && (
        <div className="empty">
          <div className="big">🌳</div>
          <b>Seu funil está vazio</b>
          <p>Promova negócios na tela de busca para acompanhá-los aqui.</p>
        </div>
      )}

      <div className="board">
        {STAGES.map(([key, label, color]) => {
          const items = leads.filter((l) => l.stage === key);
          return (
            <div key={key} className={`col ${over === key ? "over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setOver(key); }}
              onDragLeave={() => setOver((o) => (o === key ? null : o))}
              onDrop={() => { if (dragId) patch(dragId, { stage: key }); setDragId(null); setOver(null); }}>
              <h3><span className="dot" style={{ background: color }} />{label}<span className="ct">{items.length}</span></h3>
              {items.map((l) => (
                <div key={l.id} className={`lcard ${dragId === l.id ? "drag" : ""}`} draggable
                  onDragStart={() => setDragId(l.id)} onDragEnd={() => { setDragId(null); setOver(null); }}>
                  <div className="top">
                    <strong>{l.name}</strong>
                    <button className="iconbtn" aria-label="Detalhes" onClick={() => setOpen(open === l.id ? null : l.id)}>
                      {open === l.id ? "▴" : "▾"}
                    </button>
                  </div>
                  <div className="meta">
                    {l.estimated_value ? <b>{brl(l.estimated_value)}</b> : <span className="mut">Sem valor</span>}
                    {contactBadge(l.next_contact)}
                  </div>
                  {l.owner && <div className="mut" style={{ marginTop: 6 }}>👤 {l.owner}</div>}
                  {l.stage === "perdido" && l.lost_reason && <div className="mut" style={{ marginTop: 6 }}>Motivo: {l.lost_reason}</div>}
                  {l.phone && (
                    <div style={{ marginTop: 8 }}>
                      <a className="wa" href={`https://wa.me/55${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        WhatsApp · {l.phone}
                      </a>
                    </div>
                  )}
                  {open === l.id && (
                    <div className="details">
                      <label className="f">Etapa
                        <select value={l.stage} onChange={(e) => patch(l.id, { stage: e.target.value })}>
                          {STAGES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </label>
                      <label className="f">Valor estimado (R$)
                        <input type="number" min="0" defaultValue={l.estimated_value ?? ""}
                          onBlur={(e) => patch(l.id, { estimated_value: e.target.value ? Number(e.target.value) : null })} />
                      </label>
                      <label className="f">Responsável
                        <input defaultValue={l.owner ?? ""} onBlur={(e) => patch(l.id, { owner: e.target.value || null })} />
                      </label>
                      <label className="f">Próximo contato
                        <input type="date" defaultValue={l.next_contact ?? ""}
                          onChange={(e) => patch(l.id, { next_contact: e.target.value || null })} />
                      </label>
                      {l.stage === "perdido" && (
                        <label className="f">Motivo da perda
                          <input defaultValue={l.lost_reason ?? ""} onBlur={(e) => patch(l.id, { lost_reason: e.target.value || null })} />
                        </label>
                      )}
                      <span className="mut">Origem: {l.origin}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}
