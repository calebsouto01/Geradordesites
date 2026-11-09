"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KINDS, dayKey, googleCalendarUrl, startsAt, timeOf, type AgendaItem, type AgendaKind } from "@/lib/agenda";

type LeadLite = { id: number; name: string; phone: string | null };
type Draft = { id?: number; kind: AgendaKind; title: string; lead_id: string; date: string; time: string; duration: string; notes: string };

const WEEK = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const blank = (date: string): Draft => ({ kind: "reuniao", title: "", lead_id: "", date, time: "09:00", duration: "30", notes: "" });
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

export default function Agenda() {
  const supabase = createClient();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const [view, setView] = useState<"lista" | "semana" | "mes">("semana");
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [weekStart, setWeekStart] = useState(() => { const n = new Date(); n.setHours(0, 0, 0, 0); n.setDate(n.getDate() - n.getDay()); return n; });
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 45 * 86400000).toISOString();
    const [a, l] = await Promise.all([
      supabase.from("agenda_items").select("id, lead_id, kind, title, notes, starts_at, duration_min, done_at").gte("starts_at", since).order("starts_at").limit(800),
      supabase.from("leads").select("id, name, phone").order("name").limit(1000),
    ]);
    if (a.error) setErr("Não foi possível carregar a agenda.");
    setItems((a.data as AgendaItem[]) ?? []);
    setLeads((l.data as LeadLite[]) ?? []);
    setLoaded(true);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);

  const leadOf = (id: number | null) => leads.find((l) => l.id === id);
  const today = dayKey(new Date());

  const groups = useMemo(() => {
    const open = items.filter((i) => !i.done_at);
    const late = open.filter((i) => dayKey(new Date(i.starts_at)) < today && new Date(i.starts_at).getTime() < Date.now());
    const rest = open.filter((i) => !late.includes(i));
    const tomorrow = dayKey(new Date(Date.now() + 86400000));
    const week = dayKey(new Date(Date.now() + 7 * 86400000));
    const k = (i: AgendaItem) => dayKey(new Date(i.starts_at));
    return [
      { title: "Atrasados", tone: "late", rows: late },
      { title: "Hoje", tone: "", rows: rest.filter((i) => k(i) === today) },
      { title: "Amanhã", tone: "", rows: rest.filter((i) => k(i) === tomorrow) },
      { title: "Próximos 7 dias", tone: "", rows: rest.filter((i) => k(i) > tomorrow && k(i) <= week) },
      { title: "Depois", tone: "", rows: rest.filter((i) => k(i) > week) },
    ].filter((g) => g.rows.length);
  }, [items, today]);
  const done = items.filter((i) => i.done_at).sort((a, b) => b.starts_at.localeCompare(a.starts_at)).slice(0, 20);

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) return setErr("Dê um título ao compromisso.");
    if (!draft.date) return setErr("Escolha a data.");
    setErr(""); setSaving(true);
    const row = {
      kind: draft.kind, title: draft.title.trim().slice(0, 120), notes: draft.notes.trim() || null,
      lead_id: draft.lead_id ? Number(draft.lead_id) : null, starts_at: startsAt(draft.date, draft.time || "09:00"),
      duration_min: Math.min(480, Math.max(5, Number(draft.duration) || 30)),
    };
    const { error } = draft.id ? await supabase.from("agenda_items").update(row).eq("id", draft.id) : await supabase.from("agenda_items").insert(row);
    setSaving(false);
    if (error) return setErr("Não foi possível salvar o compromisso.");
    setDraft(null); load();
  }
  async function toggle(i: AgendaItem) {
    const { error } = await supabase.from("agenda_items").update({ done_at: i.done_at ? null : new Date().toISOString() }).eq("id", i.id);
    if (error) return setErr("Não foi possível atualizar."); load();
  }
  async function remove(i: AgendaItem) {
    if (!confirm(`Excluir "${i.title}"?`)) return;
    const { error } = await supabase.from("agenda_items").delete().eq("id", i.id);
    if (error) return setErr("Não foi possível excluir."); load();
  }
  const edit = (i: AgendaItem) => {
    const d = new Date(i.starts_at);
    setDraft({ id: i.id, kind: i.kind, title: i.title, lead_id: i.lead_id ? String(i.lead_id) : "", date: dayKey(d), time: d.toTimeString().slice(0, 5), duration: String(i.duration_min), notes: i.notes ?? "" });
  };

  const Card = ({ i }: { i: AgendaItem }) => {
    const l = leadOf(i.lead_id), k = KINDS[i.kind], late = !i.done_at && new Date(i.starts_at).getTime() < Date.now();
    return (
      <div className={`ag-card ${i.done_at ? "done" : ""} ${late ? "late" : ""}`}>
        <div className="ag-time"><b>{timeOf(i.starts_at)}</b><span className="mut">{i.duration_min} min</span></div>
        <div className="ag-body">
          <div className="ag-title"><span aria-hidden>{k.icon}</span> {i.title}</div>
          <div className="mut">{k.label}{l ? ` · ${l.name}` : ""}{view === "lista" ? ` · ${dayLabel(i.starts_at)}` : ""}</div>
          {i.notes && <p className="ag-notes">{i.notes}</p>}
          <div className="ag-actions">
            <button className="sm" onClick={() => toggle(i)}>{i.done_at ? "Reabrir" : "Concluir"}</button>
            <button className="ghost sm" onClick={() => edit(i)}>Editar</button>
            {l?.phone && <a className="ghost sm ag-a" href={`https://wa.me/55${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>}
            <a className="ghost sm ag-a" href={googleCalendarUrl(i, l?.name)} target="_blank" rel="noreferrer">Google Agenda</a>
            <button className="iconbtn" onClick={() => remove(i)} aria-label="Excluir" title="Excluir">🗑</button>
          </div>
        </div>
      </div>
    );
  };

  // Grade semanal: dias em colunas, horas em linhas. Clicar em um horário vazio cria o compromisso ali.
  const HOUR = 64;
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, n) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + n); return d; }), [weekStart]);
  const weekItems = useMemo(() => items.filter((i) => { const t = new Date(i.starts_at).getTime(); return t >= weekDays[0].getTime() && t < weekDays[0].getTime() + 7 * 86400000; }), [items, weekDays]);
  const [h0, h1] = useMemo(() => {
    let a = 7, b = 20;
    weekItems.forEach((i) => { const d = new Date(i.starts_at); const m = d.getHours() * 60 + d.getMinutes(); a = Math.min(a, Math.floor(m / 60)); b = Math.max(b, Math.ceil((m + i.duration_min) / 60)); });
    return [a, Math.min(24, b)];
  }, [weekItems]);
  function Week() {
    const hours = Array.from({ length: h1 - h0 }, (_, n) => h0 + n);
    const now = new Date(), nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60 - h0) * HOUR;
    const range = `${weekDays[0].toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${weekDays[6].toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}`;
    return (
      <>
        <div className="ag-mhead">
          <button className="ghost sm" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} aria-label="Semana anterior">‹</button>
          <b>{range}</b>
          <button className="ghost sm" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} aria-label="Próxima semana">›</button>
          <button className="ghost sm" onClick={() => { const n = new Date(); n.setHours(0, 0, 0, 0); n.setDate(n.getDate() - n.getDay()); setWeekStart(n); }}>Hoje</button>
        </div>
        <div className="ag-wk-wrap">
          <div className="ag-wk" style={{ ["--hh" as string]: `${HOUR}px` }}>
            <div className="ag-wk-head"><span />{weekDays.map((d) => <div key={d.toISOString()} className={`ag-wk-h ${dayKey(d) === today ? "today" : ""}`}><span>{WEEK[d.getDay()]}</span><b>{d.getDate()}</b></div>)}</div>
            <div className="ag-wk-body">
              <div className="ag-wk-hours">{hours.map((h) => <span key={h} style={{ height: HOUR }}>{String(h).padStart(2, "0")}:00</span>)}</div>
              {weekDays.map((d) => {
                const k = dayKey(d);
                const evs = weekItems.filter((i) => dayKey(new Date(i.starts_at)) === k).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
                // compromissos que se sobrepõem ficam lado a lado, dividindo só a largura do seu grupo
                const place: { i: AgendaItem; lane: number; nl: number }[] = [];
                let group: { i: AgendaItem; lane: number }[] = [], lanes: number[] = [], groupEnd = 0;
                const flush = () => { group.forEach((g) => place.push({ ...g, nl: Math.max(1, lanes.length) })); group = []; lanes = []; };
                evs.forEach((i) => {
                  const st = new Date(i.starts_at).getTime(), en = st + Math.max(i.duration_min, 30) * 60000;
                  if (group.length && st >= groupEnd) flush();
                  let lane = lanes.findIndex((end) => end <= st); if (lane < 0) { lane = lanes.length; lanes.push(en); } else lanes[lane] = en;
                  group.push({ i, lane }); groupEnd = Math.max(groupEnd, en);
                });
                flush();
                return (
                  <div key={k} className={`ag-wk-col ${k === today ? "today" : ""}`}>
                    {hours.map((h) => <button key={h} className="ag-wk-slot" style={{ height: HOUR }} aria-label={`Novo compromisso em ${k} às ${h}:00`} onClick={() => setDraft({ ...blank(k), time: `${String(h).padStart(2, "0")}:00` })} />)}
                    {k === today && nowTop >= 0 && nowTop <= (h1 - h0) * HOUR && <i className="ag-now" style={{ top: nowTop }} />}
                    {place.map(({ i, lane, nl }) => {
                      const d2 = new Date(i.starts_at), top = ((d2.getHours() * 60 + d2.getMinutes()) / 60 - h0) * HOUR, l = leadOf(i.lead_id);
                      return (
                        <button key={i.id} className={`ag-ev ${i.kind} ${i.done_at ? "done" : ""}`} onClick={() => edit(i)} title={`${timeOf(i.starts_at)} · ${i.title}${l ? ` · ${l.name}` : ""}`}
                          style={{ top, height: Math.max(22, (i.duration_min / 60) * HOUR - 2), left: `calc(${(lane / nl) * 100}% + 2px)`, width: `calc(${100 / nl}% - 4px)` }}>
                          <b>{timeOf(i.starts_at)}</b> {KINDS[i.kind].icon} {i.title}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {weekItems.length === 0 && <p className="mut">Nenhum compromisso nesta semana. Clique em um horário da grade para marcar.</p>}
      </>
    );
  }

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, n) => { const d = new Date(start); d.setDate(start.getDate() + n); return d; });
  }, [month]);
  const byDay = useMemo(() => {
    const m: Record<string, AgendaItem[]> = {};
    items.forEach((i) => { (m[dayKey(new Date(i.starts_at))] ??= []).push(i); });
    return m;
  }, [items]);

  return (
    <>
      <div className="pagehead" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div><h1>Agenda</h1><span className="mut">Reuniões de apresentação, retornos e follow-ups ligados aos seus contatos.</span></div>
        <button onClick={() => setDraft(blank(view === "mes" ? selected : today))}>+ Novo compromisso</button>
      </div>
      {err && <p className="err">{err}</p>}
      <div className="ag-tabs" role="tablist">
        <button role="tab" aria-selected={view === "semana"} className={view === "semana" ? "on" : ""} onClick={() => setView("semana")}>Semana</button>
        <button role="tab" aria-selected={view === "lista"} className={view === "lista" ? "on" : ""} onClick={() => setView("lista")}>Lista</button>
        <button role="tab" aria-selected={view === "mes"} className={view === "mes" ? "on" : ""} onClick={() => setView("mes")}>Mês</button>
      </div>

      {!loaded ? <p className="mut">Carregando…</p> : view === "semana" ? <Week /> : view === "lista" ? (
        <>
          {groups.length === 0 && <div className="panel"><b>Nada na agenda.</b><p className="mut" style={{ margin: "6px 0 0" }}>Marque a reunião de apresentação quando o dono topar ver a prévia, ou registre um retorno ao ligar: ele entra aqui sozinho.</p></div>}
          {groups.map((g) => (
            <section key={g.title} className="ag-group">
              <h3 className={g.tone}>{g.title} <span className="mut">({g.rows.length})</span></h3>
              {g.rows.map((i) => <Card key={i.id} i={i} />)}
            </section>
          ))}
          {done.length > 0 && (
            <section className="ag-group">
              <button className="ghost sm" onClick={() => setShowDone(!showDone)}>{showDone ? "Ocultar" : "Mostrar"} concluídos ({done.length})</button>
              {showDone && done.map((i) => <Card key={i.id} i={i} />)}
            </section>
          )}
        </>
      ) : (
        <>
          <div className="ag-mhead">
            <button className="ghost sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mês anterior">‹</button>
            <b>{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</b>
            <button className="ghost sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Próximo mês">›</button>
            <button className="ghost sm" onClick={() => { const n = new Date(); setMonth(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(today); }}>Hoje</button>
          </div>
          <div className="ag-grid">
            {WEEK.map((w) => <div key={w} className="ag-wd">{w}</div>)}
            {cells.map((d) => {
              const k = dayKey(d), n = (byDay[k] ?? []).filter((i) => !i.done_at).length;
              return (
                <button key={k} className={`ag-day ${d.getMonth() !== month.getMonth() ? "out" : ""} ${k === today ? "today" : ""} ${k === selected ? "sel" : ""}`} onClick={() => setSelected(k)}>
                  <span>{d.getDate()}</span>{n > 0 && <i className="ag-dot">{n}</i>}
                </button>
              );
            })}
          </div>
          <section className="ag-group">
            <h3>{dayLabel(`${selected}T12:00`)}</h3>
            {(byDay[selected] ?? []).length === 0 ? <p className="mut">Sem compromissos neste dia.</p> : byDay[selected].map((i) => <Card key={i.id} i={i} />)}
          </section>
        </>
      )}

      {draft && (
        <div className="modal" onClick={() => !saving && setDraft(null)}>
          <div className="chat" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Compromisso">
            <div className="chathead"><b>{draft.id ? "Editar compromisso" : "Novo compromisso"}</b><button className="iconbtn" onClick={() => setDraft(null)} aria-label="Fechar">✕</button></div>
            <div style={{ padding: 16, display: "grid", gap: 12 }}>
              <label className="f">Tipo
                <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as AgendaKind })}>
                  {(Object.keys(KINDS) as AgendaKind[]).map((k) => <option key={k} value={k}>{KINDS[k].label}</option>)}
                </select>
              </label>
              <label className="f">Contato
                <select value={draft.lead_id} onChange={(e) => {
                  const l = leads.find((x) => String(x.id) === e.target.value);
                  setDraft({ ...draft, lead_id: e.target.value, title: draft.title || (l ? `${KINDS[draft.kind].label.split(" ")[0]}: ${l.name}` : "") });
                }}>
                  <option value="">Sem contato ligado</option>
                  {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </label>
              <label className="f">Título<input value={draft.title} maxLength={120} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Ex.: Apresentar a prévia para o dono" /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 10 }}>
                <label className="f">Data<input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
                <label className="f">Hora<input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} /></label>
                <label className="f">Duração (min)<input type="number" min={5} max={480} step={5} value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} /></label>
              </div>
              <label className="f">Anotações<input value={draft.notes} maxLength={1000} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Opcional" /></label>
              {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
              <button disabled={saving} onClick={save}>{saving ? "Salvando…" : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
