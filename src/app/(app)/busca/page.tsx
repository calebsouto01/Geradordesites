"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { startsAt } from "@/lib/agenda";
import Stars from "@/components/Stars";
import CallPanel, { type CallLead, type CallResult, type LeadMsgs } from "@/components/CallPanel";

type Local = "prospeccao" | "retorno" | "visita" | "armazenado";
type Lead = CallLead & {
  place_id: string | null; address: string | null; rating: number | null; rating_count: number | null; photos: string[] | null;
  local: string; observacao: string | null; retorno_em: string | null; tentativas: number; motivo_visita: string | null;
};

const PAGE = 30;
const TABS: { key: Local; label: string; hint: string }[] = [
  { key: "prospeccao", label: "Para ligar", hint: "Ligue, mande WhatsApp e decida o destino de cada contato." },
  { key: "retorno", label: "Retornos", hint: "Contatos com retorno marcado, do mais próximo ao mais distante." },
  { key: "visita", label: "Para visitar", hint: "Contatos que não deu para alcançar por telefone: visite pessoalmente, de preferência no mesmo trajeto." },
  { key: "armazenado", label: "Armazenados", hint: "Contatos guardados com uma observação, para quando fizer sentido voltar." },
];

// Junta uma observação nova às anteriores, sem perder o que já estava anotado.
const MOTIVO: Record<string, string> = { telefone_indisponivel: "Telefone indisponível", numero_errado: "Número errado", sem_resposta: "Chama e ninguém atende" };
const rotaUrl = (r: Lead) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.address ?? r.name)}`;
const joinObs = (old: string | null, add?: string) => (add?.trim() ? [old, add.trim()].filter(Boolean).join(" · ").slice(0, 1000) : old);

// Fila de ligação: quem teve menos contatos primeiro; quem já foi ligado vai para o fim, e o mais ligado fica por último.
const fila = (a: Lead, b: Lead) => a.tentativas - b.tentativas || (b.rating ?? 0) - (a.rating ?? 0) || (b.rating_count ?? 0) - (a.rating_count ?? 0) || a.id - b.id;
const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function Prospeccao() {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<Local>("prospeccao");
  const [rows, setRows] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<Local, number>>({ prospeccao: 0, retorno: 0, visita: 0, armazenado: 0 });
  const [more, setMore] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [form, setForm] = useState({ location: "", category: "", minRating: "4.5" });
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<{ text: string; link?: boolean } | null>(null);
  const [next, setNext] = useState<{ token: string; params: { location: string; category: string; minRating: number } } | null>(null);
  const [calling, setCalling] = useState<Lead | null>(null);

  const flash = (text: string, link = false) => { setToast({ text, link }); setTimeout(() => setToast(null), link ? 6000 : 2500); };

  const loadCounts = useCallback(async () => {
    const q = (local: Local) => supabase.from("leads").select("*", { count: "exact", head: true }).eq("local", local);
    const [a, b, v, c] = await Promise.all([q("prospeccao"), q("retorno"), q("visita"), q("armazenado")]);
    setCounts({ prospeccao: a.count ?? 0, retorno: b.count ?? 0, visita: v.count ?? 0, armazenado: c.count ?? 0 });
  }, [supabase]);

  const load = useCallback(async (t: Local, from = 0) => {
    let q = supabase.from("leads").select("*").eq("local", t);
    q = t === "prospeccao" ? q.order("tentativas", { ascending: true }).order("rating", { ascending: false, nullsFirst: false }).order("rating_count", { ascending: false, nullsFirst: false }).order("id")
      : t === "retorno" ? q.order("retorno_em", { ascending: true, nullsFirst: false }).order("id")
      : t === "visita" ? q.order("address", { ascending: true, nullsFirst: false }).order("id") : q.order("updated_at", { ascending: false }).order("id");
    const { data } = await q.range(from, from + PAGE - 1);
    const list = (data as Lead[]) ?? [];
    setRows((cur) => (from === 0 ? list : [...cur, ...list]));
    setMore(list.length === PAGE);
    setLoaded(true);
  }, [supabase]);

  useEffect(() => { setLoaded(false); load(tab); loadCounts(); }, [tab, load, loadCounts]);
  useEffect(() => { supabase.rpc("credits_remaining").then(({ data }) => setRemaining(typeof data === "number" ? data : null)); }, [supabase]);

  async function run(params: { location: string; category: string; minRating: number }, pageToken?: string) {
    setBusy(true); setErr("");
    const res = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...params, pageToken }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setErr(json.error ?? "Erro na busca.");
    else {
      flash(json.found ? `${json.found} negócios novos sem site na lista "Para ligar"` : "Nenhum negócio novo sem site nesta busca");
      setNext(json.nextPageToken ? { token: json.nextPageToken, params } : null);
      if (typeof json.remaining === "number") setRemaining(json.remaining);
    }
    setTab("prospeccao");
    await Promise.all([load("prospeccao"), loadCounts()]);
    router.refresh();
    setBusy(false);
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    return run({ ...form, minRating: Number(form.minRating) });
  }

  // Muda o local do contato e tira o card da lista atual.
  async function move(l: Lead, changes: Record<string, unknown>) {
    const { error } = await supabase.from("leads").update(changes).eq("id", l.id);
    if (error) { setErr("Não foi possível mover o contato."); return false; }
    setRows((cur) => cur.filter((x) => x.id !== l.id));
    loadCounts();
    return true;
  }

  async function toSites(l: Lead) {
    if (await move(l, { local: "sites", stage: "novo", retorno_em: null })) { setCalling(null); flash(`${l.name} foi para Sites e vendas`, true); }
  }

  // Resultado da ligação: fica no histórico e o contato segue para o destino escolhido.
  async function finishCall(l: Lead, r: CallResult) {
    const objections = r.path.filter((id) => id.startsWith("obj_") || id === "duvida_dominio");
    const { error } = await supabase.from("calls").insert({ lead_id: l.id, channel: r.channel, script: r.script, path: r.path, objections, outcome: r.outcome });
    if (error) return setErr("Não foi possível salvar o registro da ligação.");
    // Quem recebeu uma ligação vai para o fim da fila (mais ligações, mais ao fim).
    setRows((cur) => cur.map((x) => (x.id === l.id ? { ...x, tentativas: x.tentativas + 1 } : x)).sort(tab === "prospeccao" ? fila : () => 0));
    if (r.destino === "site") return toSites(l);
    setCalling(null);
    if (r.destino === "lista") {
      if (l.local !== "prospeccao") await move(l, { local: "prospeccao", retorno_em: null, observacao: joinObs(l.observacao, r.note) });
      else if (r.note) {
        const obs = joinObs(l.observacao, r.note);
        await supabase.from("leads").update({ observacao: obs }).eq("id", l.id);
        setRows((cur) => cur.map((x) => (x.id === l.id ? { ...x, observacao: obs } : x)));
      }
      flash("Tentativa registrada: o contato continua em Para ligar");
      return;
    }
    if (r.destino === "visita") {
      if (await move(l, { local: "visita", motivo_visita: r.motivo ?? "sem_resposta", retorno_em: null, observacao: joinObs(l.observacao, r.note) })) flash("Contato enviado para Para visitar");
      return;
    }
    if (r.destino === "sem_interesse") {
      if (await move(l, { local: "armazenado", observacao: r.note?.trim() || null, retorno_em: null })) flash("Contato guardado como sem interesse");
    } else if (r.outcome === "retorno" && r.returnDate) {
      const iso = startsAt(r.returnDate, r.returnTime || "09:00");
      if (await move(l, { local: "retorno", retorno_em: iso, next_contact: r.returnDate, observacao: joinObs(l.observacao, r.note) })) {
        await supabase.from("agenda_items").insert({ lead_id: l.id, kind: "retorno", title: `Retorno: ${l.name}`, notes: r.note ?? null, starts_at: iso });
        flash("Retorno marcado e adicionado à Agenda");
      }
    }
  }

  const mapsLink = (l: Lead) => (l.place_id ? `https://www.google.com/maps/place/?q=place_id:${l.place_id}` : undefined);

  return (
    <>
      <div className="pagehead">
        <h1>Prospecção</h1>
        <span className="mut">Negócios bem avaliados no Google que ainda não têm site. Ligue aqui; quem topar ver a prévia segue para Sites e vendas.</span>
      </div>

      <form onSubmit={search} className="panel searchbar">
        <label className="f">Localização
          <input placeholder="Fortaleza, CE" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        </label>
        <label className="f">Categoria
          <input placeholder="Salão de beleza" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        </label>
        <label className="f">Nota mínima
          <select value={form.minRating} onChange={(e) => setForm({ ...form, minRating: e.target.value })}>
            {["3.5", "4.0", "4.5", "4.8"].map((n) => <option key={n} value={n}>★ {n}+</option>)}
          </select>
        </label>
        <button disabled={busy || (remaining ?? 0) < 3}>{busy ? "Buscando…" : "Buscar · 3 créditos"}</button>
      </form>
      {err && <p className="err">{err}</p>}

      <div className="ag-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? "on" : ""} onClick={() => setTab(t.key)}>{t.label} <span className="pq-n">{counts[t.key]}</span></button>
        ))}
      </div>
      <p className="mut" style={{ margin: "-4px 0 14px" }}>{TABS.find((t) => t.key === tab)?.hint}</p>

      <div className="grid">
        {busy && [0, 1, 2].map((i) => <div key={i} className="skel" />)}
        {rows.map((r) => (
          <article key={r.id} className="rcard">
            {!!r.photos?.length && (
              <div className={`pstrip n${r.photos.length}`}>
                {r.photos.map((_, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} loading="lazy" alt="" src={`/api/lead-photo?id=${r.id}&i=${i}`} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                ))}
              </div>
            )}
            {tab === "visita" && r.motivo_visita && (
              <span className="row" style={{ gap: 6 }}><span className="badge soon">{MOTIVO[r.motivo_visita] ?? r.motivo_visita}</span></span>
            )}
            {tab === "retorno" && r.retorno_em && (
              <span className="row" style={{ gap: 6 }}><span className={`badge ${new Date(r.retorno_em).getTime() < Date.now() ? "late" : "soon"}`}>Retorno {when(r.retorno_em)}</span></span>
            )}
            <h3>{r.name}</h3>
            {r.rating !== null && (
              <div className="rating"><Stars value={r.rating} /><b>{r.rating}</b><span className="mut">({r.rating_count ?? 0} avaliações)</span></div>
            )}
            <div className="line">📍 {r.address ?? "Endereço não informado"}</div>
            <div className="line pq-phone">
              <span>📞 {r.phone ?? "Sem telefone"}</span>
              {r.tentativas > 0 && <span className="badge soon" title="Quantas vezes você já fez contato com este negócio">Contato feito {r.tentativas}</span>}
            </div>
            {r.observacao && <div className="line pq-obs">📝 {r.observacao}</div>}
            <div className="actions pq-actions">
              <button className="call" onClick={() => setCalling(r)}>📞 Ligar</button>
              {tab === "visita" && <a className="pq-rota" href={rotaUrl(r)} target="_blank" rel="noreferrer">📍 Abrir rota</a>}
            </div>
          </article>
        ))}
      </div>

      {more && !busy && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button className="ghost" onClick={() => load(tab, rows.length)}>Carregar mais contatos</button>
        </div>
      )}

      {tab === "prospeccao" && next && !busy && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button className="ghost" disabled={(remaining ?? 0) < 3} onClick={() => run(next.params, next.token)}>Buscar mais resultados desta busca · 3 créditos</button>
        </div>
      )}

      {loaded && !busy && !rows.length && (
        <div className="empty">
          <div className="big">{tab === "prospeccao" ? "🔎" : tab === "retorno" ? "📞" : "🗂"}</div>
          <b>{tab === "prospeccao" ? "Nenhum contato para ligar" : tab === "retorno" ? "Nenhum retorno marcado" : "Nenhum contato armazenado"}</b>
          <p>{tab === "prospeccao" ? "Escolha uma cidade e uma categoria para listar negócios sem site." : "Eles aparecem aqui quando você marcar um retorno ou armazenar um contato."}</p>
        </div>
      )}

      {calling && (
        <CallPanel
          lead={calling} mapsUrl={mapsLink(calling)}
          onCreateSite={() => toSites(calling)} simple
          onMessages={(m: LeadMsgs) => { setCalling({ ...calling, messages: m }); setRows((cur) => cur.map((x) => (x.id === calling.id ? { ...x, messages: m } : x))); }}
          onClose={() => setCalling(null)} onFinish={(r) => finishCall(calling, r)}
        />
      )}

      {toast && <div className="toast">{toast.text}{toast.link && <> · <Link href="/funil" style={{ color: "inherit", textDecoration: "underline" }}>abrir</Link></>}</div>}
    </>
  );
}
