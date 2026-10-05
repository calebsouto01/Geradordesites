"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CallPanel, { type CallLead, type CallResult } from "@/components/CallPanel";

const STAGES = [
  ["novo", "A contatar", "#6366f1"], ["contato_iniciado", "Contato iniciado", "#38bdf8"],
  ["qualificado", "Encaminhar proposta", "#a78bfa"], ["proposta_enviada", "Proposta encaminhada", "#f59e0b"],
  ["fechado", "Venda fechada", "#22c55e"], ["perdido", "Sem venda", "#ef4444"],
] as const;

// O que fazer em cada etapa (o lead avança sozinho quando o site é gerado).
const HINT: Record<string, string> = {
  novo: "Ligue ou chame no WhatsApp.",
  contato_iniciado: "Falou com o dono? Gere o site.",
  qualificado: "Site pronto: envie a prévia.",
  proposta_enviada: "Aguardando resposta: venda ou não?",
  fechado: "Cliente fechado.", perdido: "Registre o motivo.",
};

type SiteInfo = { id: number; lead_id: number; slug: string; status: string; views: number; last_viewed_at: string | null };

const DEMO_PROFILE = {
  name: "Academia Vida Ativa (caso fictício)", category: "Academia", address: "Rua das Palmeiras, 120 — Centro, Fortaleza — CE",
  phone: "(85) 90000-0000", rating: 4.8, ratingCount: 213,
  hours: ["segunda-feira: 05:30–22:00", "terça-feira: 05:30–22:00", "quarta-feira: 05:30–22:00", "quinta-feira: 05:30–22:00", "sexta-feira: 05:30–21:00", "sábado: 08:00–13:00", "domingo: Fechado"],
  reviews: [
    { author: "Cliente A", rating: 5, text: "Professores atenciosos e equipamentos sempre em ótimo estado. Recomendo demais!" },
    { author: "Cliente B", rating: 5, text: "Ambiente limpo e acolhedor, os horários de aula cabem na minha rotina." },
    { author: "Cliente C", rating: 4, text: "Ótima estrutura e preço justo. Melhor academia do bairro." },
  ],
};

type Lead = {
  id: number; name: string; phone: string | null; origin: string; stage: string;
  estimated_value: number | null; owner: string | null; next_contact: string | null; lost_reason: string | null;
  profile?: CallLead["profile"];
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
  const [sites, setSites] = useState<Record<number, SiteInfo>>({});
  const [calling, setCalling] = useState<Lead | null>(null);
  const [busyLead, setBusyLead] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 3000); };

  async function loadSites() {
    const { data } = await supabase.from("sites").select("id, lead_id, slug, status, views, last_viewed_at");
    setSites(Object.fromEntries(((data as SiteInfo[]) ?? []).map((x) => [x.lead_id, x])));
  }

  async function generate(id: number) {
    setBusyLead(id);
    const res = await fetch("/api/sites/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: id }) });
    const json = await res.json().catch(() => ({}));
    setBusyLead(null);
    if (!res.ok) return flash(json.error ?? "Erro ao gerar o site");
    flash(json.created ? "Site gerado (3 créditos)" : "Este lead já tem site");
    await loadSites();
  }

  async function copyMessage(l: Lead, s: SiteInfo) {
    const text = `Oi! Preparei uma prévia do site da ${l.name}: ${window.location.origin}/p/${s.slug}`;
    try { await navigator.clipboard.writeText(text); flash("Mensagem copiada"); } catch { flash(text); }
  }

  // Copia a mensagem com a prévia e marca a proposta como encaminhada.
  async function sendProposal(l: Lead, s: SiteInfo) {
    await copyMessage(l, s);
    if (l.stage !== "proposta_enviada") await patch(l.id, { stage: "proposta_enviada" });
  }

  // Registra a ligação no histórico e move o lead conforme o resultado.
  async function finishCall(l: Lead, r: CallResult) {
    const objections = r.path.filter((id) => id.startsWith("obj_") || id === "duvida_dominio");
    const { error } = await supabase.from("calls").insert({ lead_id: l.id, channel: r.channel, script: r.script, path: r.path, objections, outcome: r.outcome });
    if (error) return flash("Não foi possível salvar a ligação.");
    if (r.outcome === "falou_dono" && l.stage === "novo") await patch(l.id, { stage: "contato_iniciado" });
    if (r.outcome === "retorno" && r.returnDate) await patch(l.id, { next_contact: r.returnDate });
    setCalling(null);
    flash(r.outcome === "falou_dono" && l.stage === "novo" ? "Ligação registrada: lead em Contato iniciado" : "Ligação registrada");
  }

  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Nome", "Telefone", "Origem", "Etapa", "Valor estimado", "Responsável", "Próximo contato", "Motivo da perda"];
    const rows = leads.map((l) => [l.name, l.phone, l.origin, STAGES.find(([k]) => k === l.stage)?.[1] ?? l.stage, l.estimated_value, l.owner, l.next_contact, l.lost_reason]);
    const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  }

  async function createDemo() {
    const { error } = await supabase.from("leads").insert({
      name: DEMO_PROFILE.name, phone: DEMO_PROFILE.phone, address: DEMO_PROFILE.address, profile: DEMO_PROFILE, origin: "Caso de teste",
    });
    if (error) return flash(error.message);
    const { data } = await supabase.from("leads").select("*").order("created_at");
    setLeads((data as Lead[]) ?? []);
  }

  useEffect(() => {
    supabase.from("leads").select("*").order("created_at").then(({ data }) => {
      setLeads((data as Lead[]) ?? []);
      setLoaded(true);
    });
    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Lead com site criado não fica em "A contatar" nem em "Contato iniciado": vai para "Encaminhar proposta".
  useEffect(() => {
    leads.filter((l) => ["novo", "contato_iniciado"].includes(l.stage) && sites[l.id]).forEach((l) => patch(l.id, { stage: "qualificado" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, sites]);

  async function patch(id: number, changes: Partial<Lead>) {
    setLeads((l) => l.map((x) => (x.id === id ? { ...x, ...changes } : x)));
    await supabase.from("leads").update(changes).eq("id", id);
  }

  return (
    <>
      <div className="pagehead">
        <h1>Funil de vendas</h1>
        <span className="mut">Arraste os cards entre as etapas ou use o menu do card.</span>
        <div className="row" style={{ marginTop: 10 }}><button className="ghost sm" onClick={createDemo}>+ Criar caso de teste (fictício)</button><button className="ghost sm" onClick={exportCsv} disabled={!leads.length}>Exportar CSV</button></div>
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
              <div className="mut" style={{ margin: "-6px 4px 10px", fontSize: 12 }}>{HINT[key]}</div>
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
                  <div className="row" style={{ marginTop: 8, gap: 6, flexWrap: "wrap" }}>
                    {l.stage === "novo"
                      ? <button className="sm" onClick={() => setCalling(l)}>Entrar em contato</button>
                      : <button className="ghost sm" onClick={() => setCalling(l)}>Ver script</button>}
                    {l.stage === "contato_iniciado" && !sites[l.id] && (
                      <Link href={`/sites/novo?lead=${l.id}`}><button className="sm">Gerar site · 3 créditos</button></Link>
                    )}
                    {l.stage === "contato_iniciado" && sites[l.id] && (
                      <button className="sm" onClick={() => patch(l.id, { stage: "qualificado" })}>Site pronto → encaminhar proposta</button>
                    )}
                    {l.stage === "qualificado" && !sites[l.id] && <Link href={`/sites/novo?lead=${l.id}`}><button className="sm">Gerar site · 3 créditos</button></Link>}
                    {l.stage === "qualificado" && sites[l.id] && <button className="sm" onClick={() => sendProposal(l, sites[l.id])}>Copiar msg e marcar enviada</button>}
                    {l.stage === "proposta_enviada" && (
                      <>
                        <button className="sm" onClick={() => patch(l.id, { stage: "fechado" })}>Venda fechada ✓</button>
                        <button className="ghost sm" onClick={() => { patch(l.id, { stage: "perdido" }); setOpen(l.id); }}>Não vendeu</button>
                      </>
                    )}
                    {l.stage !== "novo" && sites[l.id] && (
                      <>
                        <Link href={`/sites/${sites[l.id].id}`}><button className="ghost sm">Editar site</button></Link>
                        <a href={`/p/${sites[l.id].slug}?nv=1`} target="_blank" rel="noreferrer"><button className="ghost sm">Prévia</button></a>
                        {l.stage === "proposta_enviada" && <button className="ghost sm" onClick={() => copyMessage(l, sites[l.id])}>Copiar msg</button>}
                      </>
                    )}
                  </div>
                  {l.stage !== "novo" && sites[l.id] && (
                    <div className="mut" style={{ marginTop: 6 }}>
                      {sites[l.id].status === "publicado" ? "Publicado" : "Prévia"} ·{" "}
                      {sites[l.id].views ? `👁 ${sites[l.id].views}× (último: ${new Date(sites[l.id].last_viewed_at!).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })})` : "ainda não visualizado"}
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
      {calling && <CallPanel lead={calling} siteSlug={sites[calling.id]?.slug} siteId={sites[calling.id]?.id} onClose={() => setCalling(null)} onFinish={(r) => finishCall(calling, r)} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
