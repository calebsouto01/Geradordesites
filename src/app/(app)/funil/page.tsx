"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cleanMapsUrl } from "@/lib/site/maps";
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
  const board = useRef<HTMLDivElement>(null);
  const topbar = useRef<HTMLDivElement>(null);
  const [boardW, setBoardW] = useState(0);
  const [sbw, setSbw] = useState(0);
  const [calling, setCalling] = useState<Lead | null>(null);
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", phone: "", address: "", maps: "" });
  const [answering, setAnswering] = useState<Lead | null>(null);
  const [answer, setAnswer] = useState({ kind: "venda" as "venda" | "sem" | "pensando", value: "", reason: "", date: "" });
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

  // Barra de rolagem horizontal no topo do quadro, sincronizada com a do quadro.
  useEffect(() => {
    const el = board.current;
    if (!el) return;
    const measure = () => { setBoardW(el.scrollWidth); setSbw(el.offsetWidth - el.clientWidth); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [leads.length, loaded]);

  // Situação do lead em uma linha, a partir dos fatos do fluxo de venda.
  function statusLine(l: Lead, site?: SiteInfo) {
    const views = site?.views ? `prévia aberta ${site.views}×` : "prévia ainda não aberta";
    if (l.stage === "novo") return "Ainda sem contato.";
    if (l.stage === "contato_iniciado") return "Falou com o dono. Falta gerar o site.";
    if (l.stage === "qualificado") return "Site pronto. Proposta ainda não enviada.";
    if (l.stage === "proposta_enviada") return `Aguardando resposta · ${views}.`;
    if (l.stage === "fechado") return "Venda fechada.";
    return l.lost_reason ? `Sem venda: ${l.lost_reason}` : "Sem venda.";
  }

  // Uma única ação por etapa; o resto fica no menu do card.
  function action(l: Lead) {
    if (l.stage === "novo") return <button className="sm" onClick={() => setCalling(l)}>Entrar em contato</button>;
    if (l.stage === "contato_iniciado") return <Link href={`/sites/novo?lead=${l.id}`}><button className="sm">Gerar site · 3 créditos</button></Link>;
    if (l.stage === "qualificado") return <button className="sm" onClick={() => patch(l.id, { stage: "proposta_enviada" })}>Proposta enviada ✓</button>;
    if (l.stage === "proposta_enviada") return <button className="sm" onClick={() => { setAnswer({ kind: "venda", value: l.estimated_value ? String(l.estimated_value) : "", reason: "", date: "" }); setAnswering(l); }}>Registrar resposta</button>;
    return null;
  }

  async function saveAnswer() {
    if (!answering) return;
    const l = answering;
    if (answer.kind === "venda") {
      if (!(Number(answer.value) > 0)) return flash("Informe o valor da venda.");
      await patch(l.id, { stage: "fechado", estimated_value: Number(answer.value) });
    } else if (answer.kind === "sem") {
      await patch(l.id, { stage: "perdido", lost_reason: answer.reason.trim() || null });
    } else {
      if (!answer.date) return flash("Escolha a data do retorno.");
      await patch(l.id, { next_contact: answer.date });
    }
    setAnswering(null);
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

  async function removeLead(l: Lead) {
    if (!window.confirm(`Excluir "${l.name}"? O site e o histórico de ligações desse contato também serão apagados.`)) return;
    const { error } = await supabase.from("leads").delete().eq("id", l.id);
    if (error) return flash("Não foi possível excluir o contato.");
    setLeads((all) => all.filter((x) => x.id !== l.id));
    setOpen((o) => (o === l.id ? null : o));
    loadSites();
    flash("Contato excluído");
  }

  // Cadastro de cliente: só os dados que o sistema usa (nome, categoria, telefone e endereço).
  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return flash("Informe o nome do negócio.");
    const maps = cleanMapsUrl(form.maps);
    if (form.maps.trim() && !maps) return flash("O link precisa ser do Google Maps.");
    const profile = { name, category: form.category.trim() || undefined, address: form.address.trim() || undefined, phone: form.phone.trim() || undefined, mapsUrl: maps ?? undefined };
    const { error } = await supabase.from("leads").insert({ name, phone: profile.phone ?? null, address: profile.address ?? null, origin: "Cadastro manual", profile });
    if (error) return flash(error.message);
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setForm({ name: "", category: "", phone: "", address: "", maps: "" }); setRegistering(false);
    board.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    flash("Cliente cadastrado em A contatar");
  }

  useEffect(() => {
    supabase.from("leads").select("*").order("created_at", { ascending: false }).then(({ data }) => {
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
        <div className="row" style={{ marginTop: 10 }}><button className="ghost sm" onClick={() => setRegistering(true)}>+ Cadastrar cliente</button><button className="ghost sm" onClick={exportCsv} disabled={!leads.length}>Exportar CSV</button></div>
      </div>


      {loaded && !leads.length && (
        <div className="empty">
          <div className="big">🌳</div>
          <b>Seu funil está vazio</b>
          <p>Promova negócios na tela de busca para acompanhá-los aqui.</p>
        </div>
      )}

      <div className="boardtop" ref={topbar} aria-hidden="true" style={{ marginRight: sbw }} onScroll={() => { if (board.current && topbar.current && board.current.scrollLeft !== topbar.current.scrollLeft) board.current.scrollLeft = topbar.current.scrollLeft; }}>
        <div style={{ width: boardW, height: 1 }} />
      </div>
      <div className="board" ref={board} onScroll={() => { if (board.current && topbar.current && topbar.current.scrollLeft !== board.current.scrollLeft) topbar.current.scrollLeft = board.current.scrollLeft; }}>
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
                    <span className="row" style={{ gap: 0, flex: "none" }}>
                      <button className="iconbtn" aria-label="Excluir contato" title="Excluir contato" onClick={() => removeLead(l)}>🗑</button>
                      <button className="iconbtn" aria-label="Detalhes" onClick={() => setOpen(open === l.id ? null : l.id)}>
                        {open === l.id ? "▴" : "▾"}
                      </button>
                    </span>
                  </div>
                  <div className="meta">
                    {l.estimated_value ? <b>{brl(l.estimated_value)}</b> : <span className="mut">Sem valor</span>}
                    {contactBadge(l.next_contact)}
                  </div>
                  {l.owner && <div className="mut" style={{ marginTop: 6 }}>👤 {l.owner}</div>}
                  {l.phone && (
                    <div style={{ marginTop: 8 }}>
                      <a className="wa" href={`https://wa.me/55${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        WhatsApp · {l.phone}
                      </a>
                    </div>
                  )}
                  <div className="mut" style={{ marginTop: 8 }}>{statusLine(l, sites[l.id])}</div>
                  {action(l) && <div style={{ marginTop: 8 }}>{action(l)}</div>}
                  {open === l.id && (
                    <div className="details">
                      <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                        <button className="ghost sm" onClick={() => setCalling(l)}>Ver script</button>
                        {sites[l.id] && <Link href={`/sites/${sites[l.id].id}`}><button className="ghost sm">Editar site</button></Link>}
                        {sites[l.id] && <a href={`/p/${sites[l.id].slug}?nv=1`} target="_blank" rel="noreferrer"><button className="ghost sm">Prévia</button></a>}
                      </div>
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
      {registering && (
        <div className="modal" onClick={() => setRegistering(false)}>
          <form className="chat" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()} onSubmit={saveClient} aria-label="Cadastrar cliente">
            <div className="chathead"><b>Cadastrar cliente</b><button type="button" className="iconbtn" onClick={() => setRegistering(false)} aria-label="Fechar">✕</button></div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <label className="f">Nome do negócio *<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus required /></label>
              <label className="f">Categoria<input placeholder="Ex.: academia, salão, clínica" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
              <label className="f">Telefone / WhatsApp<input inputMode="tel" placeholder="(85) 90000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label className="f">Endereço<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
              <label className="f">Link do Google Maps<input type="url" inputMode="url" placeholder="https://maps.app.goo.gl/..." value={form.maps} onChange={(e) => setForm({ ...form, maps: e.target.value })} /></label>
              <button>Cadastrar cliente</button>
            </div>
          </form>
        </div>
      )}
      {answering && (
        <div className="modal" onClick={() => setAnswering(null)}>
          <div className="chat" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Registrar resposta">
            <div className="chathead"><b>Resposta de {answering.name}</b><button className="iconbtn" onClick={() => setAnswering(null)} aria-label="Fechar">✕</button></div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="seg">
                {([["venda", "Venda"], ["sem", "Sem venda"], ["pensando", "Ainda pensando"]] as const).map(([k, v]) => (
                  <button key={k} type="button" className={answer.kind === k ? "on" : ""} onClick={() => setAnswer({ ...answer, kind: k })}>{v}</button>
                ))}
              </div>
              {answer.kind === "venda" && <label className="f">Valor da venda (R$)<input type="number" min="0" value={answer.value} onChange={(e) => setAnswer({ ...answer, value: e.target.value })} autoFocus /></label>}
              {answer.kind === "sem" && <label className="f">Motivo<input value={answer.reason} onChange={(e) => setAnswer({ ...answer, reason: e.target.value })} placeholder="Ex.: achou caro, já tem site" autoFocus /></label>}
              {answer.kind === "pensando" && <label className="f">Retornar em<input type="date" value={answer.date} onChange={(e) => setAnswer({ ...answer, date: e.target.value })} /></label>}
              <button onClick={saveAnswer}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {calling && <CallPanel lead={calling} siteSlug={sites[calling.id]?.slug} siteId={sites[calling.id]?.id} onClose={() => setCalling(null)} onFinish={(r) => finishCall(calling, r)} />}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
