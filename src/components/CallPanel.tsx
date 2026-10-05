"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import CallTree from "@/components/CallTree";
import { KEYS, SCRIPTS, type ScriptKey } from "@/lib/scripts/data";

export type CallLead = { id: number; name: string; phone: string | null; stage: string; profile?: { category?: string; rating?: number; ratingCount?: number; prospeccao?: { observacao?: string; presenca?: string } } | null };
export type CallOutcome = "falou_dono" | "atendente" | "nao_atendeu" | "retorno";
export type CallChannel = "ligacao" | "whatsapp" | "email";
export type CallResult = { outcome: CallOutcome; channel: CallChannel; script: ScriptKey; path: string[]; returnDate?: string };

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

type Tpl = { id: string; label: string; text: (v: Vars) => string };
type Vars = { neg: string; nota: string; link: string };

// Modelos de mensagem (WhatsApp) preenchidos com os dados do lead; o usuário pode editar antes de enviar.
const TEMPLATES: Tpl[] = [
  { id: "primeiro", label: "Primeiro contato", text: (v) => `Oi, tudo bem? Aqui é [seu nome]. Vi que a ${v.neg}${v.nota ? ` tem nota ${v.nota} no Google` : " tem ótimas avaliações no Google"}, mas ainda não tem um site. Preparei uma prévia de como ficaria. Posso te mandar?` },
  { id: "semresposta", label: "Não atendeu", text: (v) => `Oi! Tentei te ligar agora há pouco sobre o site da ${v.neg}. Qual o melhor horário pra falarmos rapidinho?` },
  { id: "previa", label: "Enviar prévia", text: (v) => `Oi! Como combinado, aqui está a prévia do site da ${v.neg}: ${v.link}\nÉ só abrir no celular. Me conta o que achou!` },
  { id: "followup", label: "Retorno / follow-up", text: (v) => `Oi! Passando pra saber se você conseguiu ver a prévia do site da ${v.neg}. Se quiser algum ajuste, me avise que eu faço ainda hoje.` },
  { id: "proposta", label: "Proposta", text: (v) => `Segue a proposta pro site da ${v.neg}:\n• Plano Base: R$ [valor]\n• Plano Completo: R$ [valor]\nPrazo de entrega: [prazo]. Qual faz mais sentido pra vocês?` },
  { id: "fechado", label: "Fechamento", text: (v) => `Fechado! 🎉 Vou começar o site da ${v.neg} agora e te aviso assim que estiver no ar. Obrigado pela confiança!` },
];

const CHANNELS: { id: CallChannel; label: string; icon: string }[] = [
  { id: "ligacao", label: "Por ligação", icon: "📞" },
  { id: "whatsapp", label: "Por WhatsApp", icon: "💬" },
  { id: "email", label: "Por e-mail", icon: "✉️" },
];

// Script de contato por cima do funil: dados do lead, canal (ligação, WhatsApp, e-mail) e encerramento do contato.
export default function CallPanel({ lead, siteSlug, siteId, onClose, onFinish }: { lead: CallLead; siteSlug?: string | null; siteId?: number | null; onClose: () => void; onFinish: (r: CallResult) => void }) {
  const [channel, setChannel] = useState<CallChannel>("ligacao");
  const [script, setScript] = useState<ScriptKey>(1);
  const state = useRef<{ key: ScriptKey; path: string[] }>({ key: 1, path: [] });
  const [ret, setRet] = useState(tomorrow());
  const [ending, setEnding] = useState(false);
  const [tpl, setTpl] = useState<string>(TEMPLATES[0].id);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const p = lead.profile;
  const vars = (): Vars => ({ neg: lead.name, nota: p?.rating ? String(p.rating).replace(".", ",") : "", link: siteSlug ? `${window.location.origin}/p/${siteSlug}` : "[link da prévia]" });
  const finish = (outcome: CallOutcome) => onFinish({ outcome, channel, script: state.current.key, path: channel === "ligacao" ? state.current.path : [], returnDate: outcome === "retorno" ? ret : undefined });

  function pick(t: Tpl) { setTpl(t.id); setCopied(false); setMsg(t.text(vars())); }
  function openChannel(c: CallChannel) {
    setChannel(c);
    if (c === "whatsapp" && !msg) pick(TEMPLATES[0]);
  }
  async function copy() { try { await navigator.clipboard.writeText(msg); setCopied(true); } catch { /* sem permissão */ } }
  const digits = lead.phone?.replace(/\D/g, "");

  return (
    <div className="modal" onClick={onClose}>
      <div className="chat wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Script de contato: ${lead.name}`}>
        <div className="callhead">
          <div className="callinfo">
            <span className="callmsgs-t">Script de contato</span>
            <b>{lead.name}</b>
            <div className="mut">{[p?.category, p?.rating ? `★ ${p.rating} (${p.ratingCount ?? 0})` : null].filter(Boolean).join(" · ")}</div>
            {lead.phone && <a className="wa" href={`https://wa.me/55${digits}`} target="_blank" rel="noreferrer">WhatsApp {lead.phone}</a>}
            {p?.prospeccao?.observacao && <div className="mut">💡 {p.prospeccao.observacao}</div>}
          </div>
          <div className="callmsgs">
            {channel === "ligacao" && (
              <>
                <span className="callmsgs-t">Script</span>
                <div className="callchips" role="tablist" aria-label="Script">
                  {KEYS.map((k) => (
                    <button key={k} role="tab" aria-selected={k === script} className={`callchip scr ${k === script ? "on" : ""}`} onClick={() => setScript(k)}>
                      <b>{SCRIPTS[k].label}</b><span>{SCRIPTS[k].sub}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="callactions">
            <Link href={siteId ? `/sites/${siteId}` : `/sites/novo?lead=${lead.id}`}><button className="ghost sm">{siteId ? "Editar site" : "✦ Criar site"}</button></Link>
            <button className="sm" onClick={() => setEnding(true)}>Encerrar contato</button>
          </div>
          <button className="iconbtn callclose" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="chantabs" role="tablist" aria-label="Canal de contato">
          {CHANNELS.map((c) => (
            <button key={c.id} role="tab" aria-selected={c.id === channel} className={`chantab ${c.id === channel ? "on" : ""}`} onClick={() => openChannel(c.id)}>{c.icon} {c.label}</button>
          ))}
        </div>

        {channel === "ligacao" && (
          <div className="callbody">
            <CallTree hideTabs scriptKey={script} initialPath={state.current.key === script ? state.current.path : undefined} onChange={(s) => { state.current = s; }} />
          </div>
        )}

        {channel === "whatsapp" && (
          <div className="callbody wapp">
            <div className="wlist">
              <span className="callmsgs-t">Modelos de mensagem</span>
              {TEMPLATES.map((t) => <button key={t.id} className={`callchip ${tpl === t.id ? "on" : ""}`} onClick={() => pick(t)}>{t.label}</button>)}
            </div>
            <div className="wedit">
              <span className="callmsgs-t">Mensagem (você pode editar)</span>
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={8} aria-label="Mensagem" />
              <div className="row" style={{ gap: 8 }}>
                <button className="sm" onClick={copy}>{copied ? "Copiado ✓" : "Copiar"}</button>
                {digits ? <a href={`https://wa.me/55${digits}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"><button className="ghost sm">Abrir no WhatsApp</button></a> : <span className="mut">Lead sem telefone.</span>}
              </div>
            </div>
          </div>
        )}

        {channel === "email" && (
          <div className="callbody"><div className="panel"><b>Contato por e-mail</b><p className="mut" style={{ margin: "6px 0 0" }}>Em breve: modelos de e-mail. Por enquanto, use ligação ou WhatsApp.</p></div></div>
        )}

        {ending && (
          <div className="endsheet" role="dialog" aria-label="Como foi o contato?">
            <div className="endcard">
              <h3>Como foi o contato?</h3>
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
              <button className="ghost sm" style={{ marginTop: 12 }} onClick={() => setEnding(false)}>← Voltar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
