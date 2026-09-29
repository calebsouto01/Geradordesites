"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAGES = [
  ["novo", "Novo"], ["contato_iniciado", "Contato iniciado"], ["qualificado", "Qualificado"],
  ["proposta_enviada", "Proposta enviada"], ["negociacao", "Negociação"],
  ["fechado", "Fechado — Cliente"], ["perdido", "Perdido"],
] as const;

type Lead = {
  id: number; name: string; phone: string | null; origin: string; stage: string;
  estimated_value: number | null; owner: string | null; next_contact: string | null; lost_reason: string | null;
};

export default function Funil() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    supabase.from("leads").select("*").order("created_at").then(({ data }) => setLeads((data as Lead[]) ?? []));
  }, [supabase]);

  async function patch(id: number, changes: Partial<Lead>) {
    setLeads((l) => l.map((x) => (x.id === id ? { ...x, ...changes } : x)));
    await supabase.from("leads").update(changes).eq("id", id);
  }

  return (
    <div className="board">
      {STAGES.map(([key, label]) => {
        const items = leads.filter((l) => l.stage === key);
        return (
          <div key={key} className="col">
            <h3>{label} · {items.length}</h3>
            {items.map((l) => (
              <div key={l.id} className="card">
                <strong>{l.name}</strong>
                <div className="mut">{l.origin}</div>
                {l.phone && (
                  <a href={`https://wa.me/55${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                    WhatsApp · {l.phone}
                  </a>
                )}
                <div className="row" style={{ flexDirection: "column", alignItems: "stretch", marginTop: 8 }}>
                  <select value={l.stage} onChange={(e) => patch(l.id, { stage: e.target.value })}>
                    {STAGES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input type="number" placeholder="Valor estimado (R$)" defaultValue={l.estimated_value ?? ""}
                    onBlur={(e) => patch(l.id, { estimated_value: e.target.value ? Number(e.target.value) : null })} />
                  <input placeholder="Responsável" defaultValue={l.owner ?? ""}
                    onBlur={(e) => patch(l.id, { owner: e.target.value || null })} />
                  <input type="date" defaultValue={l.next_contact ?? ""}
                    onChange={(e) => patch(l.id, { next_contact: e.target.value || null })} />
                  {l.stage === "perdido" && (
                    <input placeholder="Motivo da perda" defaultValue={l.lost_reason ?? ""}
                      onBlur={(e) => patch(l.id, { lost_reason: e.target.value || null })} />
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
