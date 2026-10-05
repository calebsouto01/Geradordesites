"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Etapas em ordem (rampa ordinal de uma só cor); fechado/perdido são estados finais, mostrados como status.
const FLOW: [string, string][] = [
  ["novo", "A contatar"], ["contato_iniciado", "Contato iniciado"], ["qualificado", "Encaminhar proposta"], ["proposta_enviada", "Proposta encaminhada"],
];

type Lead = { id: number; name: string; phone: string | null; stage: string; next_contact: string | null; origin: string; estimated_value: number | null };
type Site = { id: number; lead_id: number; status: string; views: number; last_viewed_at: string | null };
type Msg = { id: number; site_id: number; name: string; message: string | null; created_at: string };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const ago = (iso: string) => { const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} d`; };

export default function Inicio() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [pending, setPending] = useState(0);
  const [searches, setSearches] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hideTour, setHideTour] = useState(false);
  const [table, setTable] = useState(false);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    try { setHideTour(localStorage.getItem("hideTour") === "1"); } catch { /* sem memória local */ }
    (async () => {
      const [{ data: l }, { data: s }, { data: m }, { count: p }, { count: q }, { data: sub }, { data: cr }] = await Promise.all([
        supabase.from("leads").select("id, name, phone, stage, next_contact, origin, estimated_value"),
        supabase.from("sites").select("id, lead_id, status, views, last_viewed_at"),
        supabase.from("site_leads").select("id, site_id, name, message, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("search_results").select("*", { count: "exact", head: true }).eq("status", "novo"),
        supabase.from("searches").select("*", { count: "exact", head: true }),
        supabase.from("subscriptions").select("status").maybeSingle(),
        supabase.rpc("credits_remaining"),
      ]);
      setLeads((l as Lead[]) ?? []); setSites((s as Site[]) ?? []); setMsgs((m as Msg[]) ?? []);
      setPending(p ?? 0); setSearches(q ?? 0); setSubscribed(sub?.status === "active");
      setCredits(typeof cr === "number" ? cr : null); setLoaded(true);
    })();
  }, [supabase]);

  const d = useMemo(() => {
    const by: Record<string, number> = {};
    leads.forEach((l) => (by[l.stage] = (by[l.stage] ?? 0) + 1));
    const sum = (a: Lead[]) => a.reduce((s, l) => s + (l.estimated_value ?? 0), 0);
    const active = leads.filter((l) => !["fechado", "perdido"].includes(l.stage));
    const won = leads.filter((l) => l.stage === "fechado");
    const lost = by.perdido ?? 0;
    const closed = won.length + lost;
    const today = new Date().toISOString().slice(0, 10);
    const due = active.filter((l) => l.next_contact && l.next_contact <= today).sort((a, b) => (a.next_contact! < b.next_contact! ? -1 : 1));
    const origins = Object.values(leads.reduce<Record<string, { origin: string; total: number; won: number; value: number }>>((acc, l) => {
      const o = (acc[l.origin] ??= { origin: l.origin, total: 0, won: 0, value: 0 });
      o.total++; if (l.stage === "fechado") { o.won++; o.value += l.estimated_value ?? 0; }
      return acc;
    }, {})).sort((a, b) => b.total - a.total);
    return {
      by, active: active.length, pipeline: sum(active), wonValue: sum(won), won: won.length, lost,
      rate: closed ? Math.round((won.length / closed) * 100) : null, today, due, origins,
      maxFlow: Math.max(1, ...FLOW.map(([k]) => by[k] ?? 0)), maxOrigin: Math.max(1, ...Object.values(origins).map((o) => o.total)),
    };
  }, [leads]);

  const nameOf = (leadId: number) => leads.find((l) => l.id === leadId)?.name ?? "Negócio";
  const siteName = (siteId: number) => { const s = sites.find((x) => x.id === siteId); return s ? nameOf(s.lead_id) : "seu site"; };
  const opened = sites.filter((s) => s.views > 0).length;
  const activity = [
    ...sites.filter((s) => s.last_viewed_at && Date.now() - new Date(s.last_viewed_at).getTime() < 48 * 3600e3).map((s) => ({ at: s.last_viewed_at!, text: `👁 ${nameOf(s.lead_id)} abriu a ${s.status === "publicado" ? "site" : "prévia"} (${s.views}×)` })),
    ...msgs.map((m) => ({ at: m.created_at, text: `✉ Nova mensagem de ${m.name} em ${siteName(m.site_id)}${m.message ? `: “${m.message.slice(0, 60)}”` : ""}` })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 6);

  const tour = [
    { done: searches > 0, label: "Faça sua primeira busca", href: "/busca" },
    { done: leads.length > 0, label: "Promova um resultado para o funil", href: "/busca" },
    { done: sites.length > 0, label: "Crie o site de um cliente", href: "/sites/novo" },
    { done: opened > 0, label: "Envie a prévia e veja se foi aberta", href: "/funil" },
    { done: subscribed, label: "Assine o plano para continuar depois do teste", href: "/plano" },
  ];
  const showTour = loaded && !hideTour && tour.some((t) => !t.done);
  const creditPct = credits === null ? 0 : Math.min(100, Math.round((credits / (subscribed ? 45 : 6)) * 100));

  return (
    <div className="viz">
      <div className="pagehead">
        <h1>Início</h1>
        <span className="mut">Resumo geral: da busca ao cliente fechado.</span>
        <div className="row" style={{ marginTop: 10 }}>
          <Link href="/busca"><button className="sm">⌕ Nova busca</button></Link>
          <Link href="/funil"><button className="ghost sm">▦ Abrir funil</button></Link>
        </div>
      </div>

      {showTour && (
        <div className="panel" style={{ marginBottom: 22 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>Primeiros passos · {tour.filter((t) => t.done).length}/{tour.length}</h2>
            <button className="ghost sm" onClick={() => { setHideTour(true); try { localStorage.setItem("hideTour", "1"); } catch { /* ok */ } }}>Ocultar</button>
          </div>
          <ul className="checks" style={{ maxHeight: "none" }}>
            {tour.map((t) => (
              <li key={t.label} className={t.done ? "ok" : ""}><i>{t.done ? "✓" : "○"}</i><div><b>{t.label}</b></div>{!t.done && <Link href={t.href}><button className="ghost sm">Ir</button></Link>}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Faixa de indicadores: número principal + tiles */}
      <div className="kpis">
        <div className="stat hero">
          <div className="mut">Vendas fechadas</div>
          <div className="big">{brl(d.wonValue)}</div>
          <div className="mut">{d.won} cliente(s) fechado(s){d.rate !== null && <> · taxa de fechamento <b>{d.rate}%</b></>}</div>
        </div>
        <div className="stat"><div className="mut">Leads ativos</div><div className="n">{d.active}</div></div>
        <div className="stat"><div className="mut">Valor em aberto</div><div className="n">{brl(d.pipeline)}</div></div>
        <div className="stat"><div className="mut">Prospects para revisar</div><div className="n">{pending}</div>{pending > 0 && <Link href="/busca" className="mut">Revisar →</Link>}</div>
        <div className="stat">
          <div className="mut">Créditos {subscribed ? "do mês" : "de teste"}</div>
          <div className="n">{credits ?? "—"}</div>
          <div className="meter" role="img" aria-label={`${creditPct}% dos créditos restantes`}><div style={{ width: `${creditPct}%` }} /></div>
          {!subscribed && <Link href="/plano" className="mut">Assinar plano →</Link>}
        </div>
      </div>

      {/* Funil: etapas em ordem, uma cor em rampa */}
      <div className="panel" style={{ marginBottom: 22 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Funil de vendas</h2>
          <button className="ghost sm" onClick={() => setTable((t) => !t)}>{table ? "Ver gráfico" : "Ver tabela"}</button>
        </div>
        {loaded && !leads.length ? (
          <p className="mut" style={{ margin: "14px 0 0" }}>Ainda não há leads. <Link href="/busca">Faça uma busca</Link> e promova resultados para o funil.</p>
        ) : table ? (
          <table className="vtable">
            <thead><tr><th>Etapa</th><th>Leads</th><th>Valor</th></tr></thead>
            <tbody>
              {[...FLOW, ["fechado", "Venda fechada"], ["perdido", "Sem venda"]].map(([k, label]) => (
                <tr key={k}><td>{label}</td><td>{d.by[k] ?? 0}</td><td>{brl(leads.filter((l) => l.stage === k).reduce((s, l) => s + (l.estimated_value ?? 0), 0))}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <>
            <div className="fun" onMouseLeave={() => setTip(null)}>
              {FLOW.map(([k, label], i) => {
                const n = d.by[k] ?? 0;
                const prev = i ? d.by[FLOW[i - 1][0]] ?? 0 : 0;
                const txt = `${label}: ${n} lead(s)${i && prev ? ` · ${Math.round((n / prev) * 100)}% da etapa anterior` : ""}`;
                return (
                  <div key={k} className="frow" tabIndex={0} onMouseEnter={() => setTip(txt)} onFocus={() => setTip(txt)} onBlur={() => setTip(null)}>
                    <span className="mut">{label}</span>
                    <div className="ftrack"><div className={`fbar s${i}`} style={{ width: `${(n / d.maxFlow) * 100}%` }} /></div>
                    <b>{n}</b>
                  </div>
                );
              })}
            </div>
            <div className="ftip mut" aria-live="polite">{tip ?? "Passe o mouse sobre uma etapa para ver a conversão."}</div>
            <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <span className="chip good">✓ Vendas <b>{d.won}</b></span>
              <span className="chip crit">✕ Sem venda <b>{d.lost}</b></span>
            </div>
          </>
        )}
      </div>

      <div className="twocol">
        <div className="panel">
          <h2 style={{ fontSize: 16 }}>Retornos de hoje {d.due.length > 0 && <span className="badge late">{d.due.length}</span>}</h2>
          {d.due.length ? (
            <ul className="rev">
              {d.due.slice(0, 6).map((l) => (
                <li key={l.id}>
                  <span><b>{l.name}</b> <span className="mut">· {l.next_contact === d.today ? "hoje" : `atrasado desde ${new Date(l.next_contact! + "T00:00").toLocaleDateString("pt-BR")}`}</span></span>
                  {l.phone ? <a className="wa" href={`https://wa.me/55${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a> : <Link href="/funil">Abrir</Link>}
                </li>
              ))}
            </ul>
          ) : <p className="mut" style={{ margin: 0 }}>Nenhum retorno pendente. Defina o “próximo contato” nos cards do funil.</p>}
        </div>
        <div className="panel">
          <h2 style={{ fontSize: 16 }}>Atividade recente</h2>
          {activity.length ? (
            <ul className="rev">{activity.map((a, i) => <li key={i}><span>{a.text}</span><span className="mut">{ago(a.at)}</span></li>)}</ul>
          ) : <p className="mut" style={{ margin: 0 }}>Quando um cliente abrir uma prévia ou enviar uma mensagem, aparece aqui.</p>}
          {sites.length > 0 && <p className="mut" style={{ margin: "10px 0 0" }}>{sites.length} site(s) criado(s) · {opened} já aberto(s) pelo cliente</p>}
        </div>
      </div>

      {d.origins.length > 0 && (
        <div className="panel" style={{ margin: "22px 0" }}>
          <h2 style={{ fontSize: 16 }}>Leads por origem</h2>
          <div className="fun">
            {d.origins.map((o) => (
              <div key={o.origin} className="orow" title={`${o.origin}: ${o.total} lead(s), ${o.won} fechado(s), ${brl(o.value)}`}>
                <span>{o.origin}</span>
                <div className="ftrack"><div className="fbar one" style={{ width: `${(o.total / d.maxOrigin) * 100}%` }} /></div>
                <b>{o.total}</b>
                <span className="mut">{o.won} fechado(s) · {Math.round((o.won / o.total) * 100)}% · {brl(o.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
