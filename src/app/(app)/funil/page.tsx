"use client";
import Link from "next/link";
import CreationChat from "@/components/site/CreationChat";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STAGES = [
  ["novo", "Novo", "#6366f1"], ["contato_iniciado", "Contato iniciado", "#38bdf8"],
  ["qualificado", "Qualificado", "#a78bfa"], ["proposta_enviada", "Proposta enviada", "#f59e0b"],
  ["negociacao", "Negociação", "#fb923c"], ["fechado", "Fechado — Cliente", "#22c55e"],
  ["perdido", "Perdido", "#ef4444"],
] as const;

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
  const [busyLead, setBusyLead] = useState<number | null>(null);
  const [chatLead, setChatLead] = useState<Lead | null>(null);
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
        <div style={{ marginTop: 10 }}><button className="ghost sm" onClick={createDemo}>+ Criar caso de teste (fictício)</button></div>
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
                  <div className="row" style={{ marginTop: 8, gap: 6 }}>
                    {!sites[l.id] ? (
                      <button className="sm" disabled={busyLead === l.id} onClick={() => setChatLead(l)}>
                        Criar site · 3 créditos
                      </button>
                    ) : (
                      <>
                        <Link href={`/sites/${sites[l.id].id}`}><button className="sm">Editar site</button></Link>
                        <a href={`/p/${sites[l.id].slug}?nv=1`} target="_blank" rel="noreferrer"><button className="ghost sm">Prévia</button></a>
                        <button className="ghost sm" onClick={() => copyMessage(l, sites[l.id])}>Copiar msg</button>
                      </>
                    )}
                  </div>
                  {sites[l.id] && (
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
      {chatLead && (
        <CreationChat leadId={chatLead.id} leadName={chatLead.name} onClose={() => setChatLead(null)}
          onDone={async () => { setChatLead(null); flash("Site gerado (3 créditos)"); await loadSites(); }} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
