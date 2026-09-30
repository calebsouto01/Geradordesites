"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAGES: [string, string, string][] = [
  ["novo", "Novo", "#6366f1"], ["contato_iniciado", "Contato iniciado", "#38bdf8"],
  ["qualificado", "Qualificado", "#a78bfa"], ["proposta_enviada", "Proposta enviada", "#f59e0b"],
  ["negociacao", "Negociação", "#fb923c"], ["fechado", "Fechado", "#22c55e"], ["perdido", "Perdido", "#ef4444"],
];

export default function Prospeccao() {
  const supabase = createClient();
  const [stages, setStages] = useState<Record<string, number>>({});
  const [pending, setPending] = useState(0);
  const [searches, setSearches] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: leads }, { count: p }, { count: s }] = await Promise.all([
        supabase.from("leads").select("stage"),
        supabase.from("search_results").select("*", { count: "exact", head: true }).eq("status", "novo"),
        supabase.from("searches").select("*", { count: "exact", head: true }),
      ]);
      const c: Record<string, number> = {};
      (leads ?? []).forEach((l: { stage: string }) => (c[l.stage] = (c[l.stage] ?? 0) + 1));
      setStages(c); setPending(p ?? 0); setSearches(s ?? 0);
    })();
  }, [supabase]);

  const total = Object.values(stages).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="pagehead">
        <h1>Prospecção</h1>
        <span className="mut">Visão geral: do resultado da busca ao cliente fechado.</span>
      </div>

      <div className="stats">
        <div className="stat"><div className="mut">Buscas realizadas</div><div className="n">{searches}</div></div>
        <div className="stat"><div className="mut">Prospects para revisar</div><div className="n">{pending}</div></div>
        <div className="stat"><div className="mut">Leads no funil</div><div className="n">{total}</div></div>
        <div className="stat"><div className="mut">Clientes fechados</div><div className="n" style={{ color: "var(--ok)" }}>{stages.fechado ?? 0}</div></div>
      </div>

      <div className="panel" style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 16 }}>Plano e créditos</h2>
        <span className="mut">Plano Inicial · R$ 49,90/mês · 45 créditos. Cada busca custa 3 créditos e cada site gerado custa 3 créditos.</span>
      </div>

      <div className="panel" style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 16 }}>Leads por etapa</h2>
        <div className="bars">
          {STAGES.map(([k, label, color]) => (
            <div key={k} className="barrow">
              <span className="mut">{label}</span>
              <div className="track"><div style={{ width: total ? `${((stages[k] ?? 0) / total) * 100}%` : 0, background: color }} /></div>
              <b>{stages[k] ?? 0}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="grid" style={{ marginTop: 0 }}>
        <Link href="/busca" className="rcard"><h3>⌕ Nova busca</h3><span className="mut">Encontre negócios bem avaliados sem site.</span></Link>
        <Link href="/funil" className="rcard"><h3>▦ Abrir funil</h3><span className="mut">Acompanhe cada lead até o fechamento.</span></Link>
      </div>
    </>
  );
}
