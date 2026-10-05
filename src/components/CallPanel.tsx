"use client";
import { useRef, useState } from "react";
import CallTree from "@/components/CallTree";
import type { ScriptKey } from "@/lib/scripts/data";

export type CallLead = { id: number; name: string; phone: string | null; stage: string; profile?: { category?: string; rating?: number; ratingCount?: number; prospeccao?: { observacao?: string; presenca?: string } } | null };
export type CallOutcome = "falou_dono" | "atendente" | "nao_atendeu" | "retorno";
export type CallResult = { outcome: CallOutcome; script: ScriptKey; path: string[]; returnDate?: string };

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

// Painel por cima do funil: árvore de negociação do lead + registro do resultado da ligação.
export default function CallPanel({ lead, onClose, onFinish }: { lead: CallLead; onClose: () => void; onFinish: (r: CallResult) => void }) {
  const state = useRef<{ key: ScriptKey; path: string[] }>({ key: 1, path: [] });
  const [ret, setRet] = useState(tomorrow());
  const p = lead.profile;
  const finish = (outcome: CallOutcome) => onFinish({ outcome, script: state.current.key, path: state.current.path, returnDate: outcome === "retorno" ? ret : undefined });

  return (
    <div className="modal" onClick={onClose}>
      <div className="chat wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Ligação para ${lead.name}`}>
        <div className="chathead">
          <div>
            <b>{lead.name}</b>
            <div className="mut">
              {[p?.category, p?.rating ? `★ ${p.rating} (${p.ratingCount ?? 0})` : null].filter(Boolean).join(" · ")}
              {lead.phone && <> · <a className="wa" href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp {lead.phone}</a></>}
            </div>
            {p?.prospeccao?.observacao && <div className="mut">💡 {p.prospeccao.observacao}</div>}
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="callbody"><CallTree onChange={(s) => { state.current = s; }} /></div>
        <div className="callfoot">
          <h3>Como foi a ligação?</h3>
          <div className="outcomes">
            <button className="outcome main" onClick={() => finish("falou_dono")}>
              ✅ Falei com o dono<small>{lead.stage === "novo" ? "Avança para Contato iniciado" : "Registra no histórico"}</small>
            </button>
            <button className="outcome" onClick={() => finish("atendente")}>🧑‍💼 Falei com atendente<small>Tentar chegar ao responsável</small></button>
            <button className="outcome" onClick={() => finish("nao_atendeu")}>📵 Não atendeu<small>Registra a tentativa</small></button>
            <div className="outcome-ret">
              <b>🔁 Pediu retorno</b>
              <div className="row">
                <input type="date" value={ret} onChange={(e) => setRet(e.target.value)} aria-label="Data do retorno" />
                <button className="sm" onClick={() => finish("retorno")}>Agendar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
