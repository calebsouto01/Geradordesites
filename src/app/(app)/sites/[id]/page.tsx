"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LayoutKey, SiteContent, SiteRow } from "@/lib/site/types";
import { themeFromAccent } from "@/lib/site/palette-client";

export default function EditarSite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [site, setSite] = useState<SiteRow | null>(null);
  const [c, setC] = useState<SiteContent | null>(null);
  const [servicesText, setServicesText] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.from("sites").select("*").eq("id", id).single().then(({ data }) => {
      if (!data) return;
      const row = data as SiteRow;
      setSite(row); setC(row.content);
      setServicesText(row.content.services.items.map((s) => `${s.title} — ${s.text}`).join("\n"));
    });
  }, [supabase, id]);

  if (!site || !c) return <p className="mut">Carregando…</p>;

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };

  async function save() {
    const items = servicesText.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const [title, ...rest] = l.split("—");
      return { title: title.trim(), text: rest.join("—").trim() };
    });
    const content: SiteContent = { ...c!, services: { ...c!.services, items } };
    const { error } = await supabase.from("sites").update({ content }).eq("id", id);
    flash(error ? "Erro ao salvar" : "Alterações salvas");
  }

  async function publish() {
    await save();
    const { error } = await supabase.from("sites").update({ status: "publicado", expires_at: null }).eq("id", id);
    if (!error) setSite({ ...site!, status: "publicado" });
    flash(error ? "Erro ao publicar" : "Site publicado");
  }

  const set = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => setC({ ...c!, [k]: v });
  const url = `/p/${site.slug}?nv=1`;

  return (
    <>
      <div className="pagehead">
        <Link href="/funil" className="mut">← Voltar ao funil</Link>
        <h1>{c.business.name}</h1>
        <span className="mut">
          {site.status === "publicado" ? "Publicado" : "Prévia com marca d'água"} · {site.views} visualizações do cliente
        </span>
      </div>

      <div className="panel" style={{ display: "grid", gap: 14, maxWidth: 720 }}>
        <label className="f">Título principal
          <input value={c.hero.headline} onChange={(e) => set("hero", { ...c.hero, headline: e.target.value })} />
        </label>
        <label className="f">Subtítulo
          <input value={c.hero.subheadline} onChange={(e) => set("hero", { ...c.hero, subheadline: e.target.value })} />
        </label>
        <label className="f">Texto do botão
          <input value={c.hero.cta} onChange={(e) => set("hero", { ...c.hero, cta: e.target.value })} />
        </label>
        <label className="f">Sobre
          <textarea rows={4} value={c.about.text} onChange={(e) => set("about", { ...c.about, text: e.target.value })} />
        </label>
        <label className="f">Serviços (um por linha: Título — descrição)
          <textarea rows={5} value={servicesText} onChange={(e) => setServicesText(e.target.value)} />
        </label>
        <label className="f">WhatsApp (com DDD, só números)
          <input value={c.business.whatsapp} onChange={(e) => set("business", { ...c.business, whatsapp: e.target.value.replace(/\D/g, "") })} />
        </label>
        <label className="f">Layout (trocar não gasta crédito)
          <select value={site.template} onChange={async (e) => {
            const template = e.target.value as LayoutKey;
            const { error } = await supabase.from("sites").update({ template }).eq("id", id);
            if (!error) setSite({ ...site, template });
            flash(error ? "Erro ao trocar o layout" : "Layout alterado");
          }}>
            <option value="classico">Clássico</option>
            <option value="moderno">Moderno</option>
            <option value="vitrine">Vitrine</option>
          </select>
        </label>
        <label className="f">Cor principal
          <input type="color" value={c.theme.accent} onChange={(e) => set("theme", themeFromAccent(e.target.value))} style={{ height: 42, padding: 4 }} />
        </label>
        <div className="row">
          <button onClick={save}>Salvar</button>
          <a href={url} target="_blank" rel="noreferrer"><button type="button" className="ghost">Abrir prévia</button></a>
          {site.status !== "publicado" && <button className="ghost" onClick={publish}>Publicar site</button>}
        </div>
      </div>
      {msg && <div className="toast">{msg}</div>}
    </>
  );
}
