"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Lead = { id: number; name: string };
type Site = { id: number; lead_id: number; slug: string; status: string; template: string; views: number; last_viewed_at: string | null; expires_at: string | null };

const LAYOUT = { classico: "Clássico", moderno: "Moderno", vitrine: "Vitrine" } as Record<string, string>;

export default function Sites() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 3000); };

  const load = useCallback(async () => {
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from("leads").select("id, name").order("created_at", { ascending: false }),
      supabase.from("sites").select("id, lead_id, slug, status, template, views, last_viewed_at, expires_at").order("created_at", { ascending: false }),
    ]);
    setLeads((l as Lead[]) ?? []); setSites((s as Site[]) ?? []); setLoaded(true);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const nameOf = (id: number) => leads.find((l) => l.id === id)?.name ?? "Negócio";

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

      <div className="panel" style={{ marginBottom: 22, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ fontSize: 16 }}>Novo site</h2>
          <span className="mut">4 passos guiados pelo assistente: modelo, cliente, dados e revisão.</span>
        </div>
        <Link href="/sites/novo"><button>+ Criar site · 3 créditos</button></Link>
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

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
