"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CreationChat from "@/components/site/CreationChat";

type Lead = { id: number; name: string; phone: string | null; address: string | null };
type Site = { id: number; lead_id: number; slug: string; status: string; template: string; views: number; last_viewed_at: string | null; expires_at: string | null };

const DEMO = {
  name: "Academia Vida Ativa (caso fictício)", category: "Academia", address: "Rua das Palmeiras, 120 — Centro, Fortaleza — CE",
  phone: "(85) 90000-0000", rating: 4.8, ratingCount: 213,
  hours: ["segunda-feira: 05:30–22:00", "terça-feira: 05:30–22:00", "quarta-feira: 05:30–22:00", "quinta-feira: 05:30–22:00", "sexta-feira: 05:30–21:00", "sábado: 08:00–13:00", "domingo: Fechado"],
  reviews: [
    { author: "Cliente A", rating: 5, text: "Professores atenciosos e equipamentos sempre em ótimo estado. Recomendo demais!" },
    { author: "Cliente B", rating: 5, text: "Ambiente limpo e acolhedor, os horários de aula cabem na minha rotina." },
  ],
};

const LAYOUT = { classico: "Clássico", moderno: "Moderno", vitrine: "Vitrine" } as Record<string, string>;

export default function Sites() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pick, setPick] = useState("");
  const [chat, setChat] = useState<Lead | null>(null);
  const [toast, setToast] = useState("");
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(async () => {
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from("leads").select("id, name, phone, address").order("created_at", { ascending: false }),
      supabase.from("sites").select("id, lead_id, slug, status, template, views, last_viewed_at, expires_at").order("created_at", { ascending: false }),
    ]);
    setLeads((l as Lead[]) ?? []); setSites((s as Site[]) ?? []); setLoaded(true);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const withSite = new Set(sites.map((s) => s.lead_id));
  const free = leads.filter((l) => !withSite.has(l.id));
  const nameOf = (id: number) => leads.find((l) => l.id === id)?.name ?? "Negócio";

  async function createDemo() {
    const { error } = await supabase.from("leads").insert({ name: DEMO.name, phone: DEMO.phone, address: DEMO.address, profile: DEMO, origin: "Caso de teste" });
    if (error) return flash(error.message);
    await load(); flash("Caso de teste criado");
  }

  async function copyMessage(s: Site) {
    const text = `Oi! Preparei uma prévia do site da ${nameOf(s.lead_id)}: ${window.location.origin}/p/${s.slug}`;
    try { await navigator.clipboard.writeText(text); flash("Mensagem copiada"); } catch { flash(text); }
  }

  return (
    <>
      <div className="pagehead">
        <h1>Criar site</h1>
        <span className="mut">Escolha um negócio da sua lista e monte o site com o assistente. Cada site custa 3 créditos.</span>
      </div>

      <div className="panel" style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 16 }}>Novo site</h2>
        {free.length > 0 ? (
          <div className="row" style={{ marginTop: 10 }}>
            <select value={pick} onChange={(e) => setPick(e.target.value)} style={{ flex: 1, minWidth: 200 }}>
              <option value="">Selecione o negócio…</option>
              {free.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button disabled={!pick} onClick={() => setChat(free.find((l) => String(l.id) === pick) ?? null)}>Criar site · 3 créditos</button>
          </div>
        ) : (
          <p className="mut" style={{ margin: "8px 0 12px" }}>
            {loaded && !leads.length ? "Você ainda não tem negócios. Promova um resultado na Busca ou crie um caso de teste." : "Todos os seus negócios já têm site."}
          </p>
        )}
        <div className="row" style={{ marginTop: 10 }}>
          <Link href="/busca"><button className="ghost sm" type="button">Buscar negócios</button></Link>
          <button className="ghost sm" onClick={createDemo}>+ Criar caso de teste (fictício)</button>
        </div>
      </div>

      <h2 style={{ fontSize: 16 }}>Meus sites</h2>
      {loaded && !sites.length && (
        <div className="empty"><div className="big">🌐</div><b>Nenhum site criado</b><p>Escolha um negócio acima para começar.</p></div>
      )}
      <div className="grid" style={{ marginTop: 12 }}>
        {sites.map((s) => (
          <article key={s.id} className="rcard">
            <span className={`badge ${s.status === "publicado" ? "" : "soon"}`}>{s.status === "publicado" ? "Publicado" : "Prévia"}</span>
            <h3>{nameOf(s.lead_id)}</h3>
            <div className="mut">Layout {LAYOUT[s.template] ?? "Clássico"}</div>
            <div className="mut">
              {s.views ? `👁 ${s.views} visualizações · último: ${new Date(s.last_viewed_at!).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : "Ainda não visualizado"}
              {s.status !== "publicado" && s.expires_at ? ` · expira ${new Date(s.expires_at).toLocaleDateString("pt-BR")}` : ""}
            </div>
            <div className="actions" style={{ flexWrap: "wrap" }}>
              <Link href={`/sites/${s.id}`}><button className="sm">Editar</button></Link>
              <a href={`/p/${s.slug}?nv=1`} target="_blank" rel="noreferrer"><button className="ghost sm">Prévia</button></a>
              <button className="ghost sm" onClick={() => copyMessage(s)}>Copiar msg</button>
            </div>
          </article>
        ))}
      </div>

      {chat && (
        <CreationChat leadId={chat.id} leadName={chat.name} onClose={() => setChat(null)}
          onDone={async () => { setChat(null); setPick(""); flash("Site criado (3 créditos)"); await load(); }} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
