"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageSlot from "@/components/ImageSlot";
import { uploadImage } from "@/lib/client/upload";
import type { LayoutKey, SectionKey, SiteContent, SiteRow } from "@/lib/site/types";
import { themeFromAccent } from "@/lib/site/palette-client";
import { SECTION_LABELS, fmtPairs, fmtPrices, fmtTeam, hasData, parsePairs, parsePrices, parseTeam, resolveSections } from "@/lib/site/sections";
import { layoutOf } from "@/components/SiteRender";

const move = <T,>(a: T[], i: number, d: number) => { const b = [...a]; [b[i], b[i + d]] = [b[i + d], b[i]]; return b; };
type Version = { id: number; template: string | null; content: SiteContent; created_at: string };
type Lead = { id: number; name: string; phone: string | null; message: string | null; created_at: string };
type Stats = { view: number; whatsapp: number; mapa: number; form: number };

export default function EditarSite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [site, setSite] = useState<SiteRow | null>(null);
  const [c, setC] = useState<SiteContent | null>(null);
  const [servicesText, setServicesText] = useState("");
  const [msg, setMsg] = useState("");
  const [ex, setEx] = useState({ years: "", steps: "", differentials: "", plans: "", catalog: "", team: "", promoTitle: "", promoText: "" });
  const [secs, setSecs] = useState<{ key: SectionKey; on: boolean }[]>([]);
  const [stats, setStats] = useState<Stats>({ view: 0, whatsapp: 0, mapa: 0, form: 0 });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [domain, setDomain] = useState("");
  const [domainInfo, setDomainInfo] = useState("");

  const hydrate = useCallback((row: SiteRow) => {
    const k = row.content;
    setSite(row); setC(k);
    setServicesText(k.services.items.map((s) => `${s.title} — ${s.text}`).join("\n"));
    setEx({ years: k.years ? String(k.years) : "", steps: fmtPairs(k.steps), differentials: fmtPairs(k.differentials), plans: fmtPrices(k.plans), catalog: fmtPrices(k.catalog), team: fmtTeam(k.team), promoTitle: k.promo?.title ?? "", promoText: k.promo?.text ?? "" });
    setSecs(resolveSections(k, layoutOf(row.template, k)));
    setDomain((row as SiteRow & { custom_domain?: string | null }).custom_domain ?? "");
  }, []);

  const loadExtras = useCallback(async () => {
    const count = (kind: string) => supabase.from("site_events").select("*", { count: "exact", head: true }).eq("site_id", id).eq("kind", kind);
    const [v, w, m, f, { data: l }, { data: vs }] = await Promise.all([
      count("view"), count("whatsapp"), count("mapa"), count("form"),
      supabase.from("site_leads").select("id, name, phone, message, created_at").eq("site_id", id).order("created_at", { ascending: false }).limit(20),
      supabase.from("site_versions").select("id, template, content, created_at").eq("site_id", id).order("id", { ascending: false }).limit(10),
    ]);
    setStats({ view: v.count ?? 0, whatsapp: w.count ?? 0, mapa: m.count ?? 0, form: f.count ?? 0 });
    setLeads((l as Lead[]) ?? []); setVersions((vs as Version[]) ?? []);
  }, [supabase, id]);

  useEffect(() => {
    supabase.from("sites").select("*").eq("id", id).single().then(({ data }) => { if (data) hydrate(data as SiteRow); });
    loadExtras();
  }, [supabase, id, hydrate, loadExtras]);

  if (!site || !c) return <p className="mut">Carregando…</p>;

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2800); };
  const set = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => setC({ ...c, [k]: v });
  const media = c.media ?? {};
  const setMedia = (patch: Partial<NonNullable<SiteContent["media"]>>) => setC({ ...c, media: { ...media, ...patch } });
  const setItem = (k: "equipe" | "catalogo", i: number, url: string) => { const a = [...(media[k] ?? [])]; a[i] = url; setMedia({ [k]: a }); };
  const putImage = async (f: File, apply: (url: string) => void) => { const r = await uploadImage(f, "foto"); if (r.url) apply(r.url); else flash(r.error ?? "Erro ao enviar a imagem"); };
  const teamLines = parseTeam(ex.team), catLines = parsePrices(ex.catalog);

  async function save(silent = false) {
    const items = parsePairs(servicesText);
    const content: SiteContent = {
      ...c!, services: { ...c!.services, items }, years: Number(ex.years) || undefined,
      steps: parsePairs(ex.steps), differentials: parsePairs(ex.differentials), plans: parsePrices(ex.plans), catalog: parsePrices(ex.catalog), team: parseTeam(ex.team),
      promo: ex.promoTitle.trim() ? { title: ex.promoTitle.trim(), text: ex.promoText.trim() } : undefined, sections: secs,
    };
    if (!content.steps?.length) delete content.steps; if (!content.differentials?.length) delete content.differentials;
    if (!content.plans?.length) delete content.plans; if (!content.catalog?.length) delete content.catalog; if (!content.team?.length) delete content.team;
    const { error } = await supabase.from("sites").update({ content }).eq("id", id);
    if (!silent) flash(error ? "Erro ao salvar" : "Alterações salvas");
    if (!error) loadExtras();
    return !error;
  }

  async function publish() {
    if (!(await save(true))) return flash("Erro ao publicar");
    const { error } = await supabase.from("sites").update({ status: "publicado", expires_at: null }).eq("id", id);
    if (!error) setSite({ ...site!, status: "publicado" });
    flash(error ? "Erro ao publicar" : "Site publicado");
  }

  async function restore(v: Version) {
    if (!confirm("Restaurar esta versão? A versão atual fica no histórico.")) return;
    const { data, error } = await supabase.from("sites").update({ content: v.content, ...(v.template ? { template: v.template } : {}) }).eq("id", id).select("*").single();
    if (error || !data) return flash("Erro ao restaurar");
    hydrate(data as SiteRow); loadExtras(); flash("Versão restaurada");
  }

  async function saveDomain() {
    setDomainInfo("");
    const res = await fetch("/api/sites/domain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteId: Number(id), domain }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setDomainInfo(json.error ?? "Não foi possível salvar o domínio.");
    setDomainInfo(json.instructions ?? "Domínio salvo.");
  }

  const url = `/p/${site.slug}?nv=1`;
  const previewContent: SiteContent = { ...c, years: Number(ex.years) || undefined, steps: parsePairs(ex.steps), plans: parsePrices(ex.plans), catalog: parsePrices(ex.catalog), team: parseTeam(ex.team), promo: ex.promoTitle.trim() ? { title: ex.promoTitle, text: ex.promoText } : undefined };

  return (
    <>
      <div className="pagehead">
        <Link href="/sites" className="mut">← Meus sites</Link>
        <h1>{c.business.name}</h1>
        <span className="mut">{site.status === "publicado" ? "Publicado" : site.status === "bloqueado" ? "Bloqueado por denúncia" : "Prévia com marca d'água"}</span>
      </div>

      <div className="stats">
        <div className="stat"><div className="mut">Visualizações</div><div className="n">{stats.view}</div></div>
        <div className="stat"><div className="mut">Cliques no WhatsApp</div><div className="n">{stats.whatsapp}</div></div>
        <div className="stat"><div className="mut">Cliques no mapa</div><div className="n">{stats.mapa}</div></div>
        <div className="stat"><div className="mut">Mensagens</div><div className="n">{stats.form}</div></div>
      </div>

      {leads.length > 0 && (
        <div className="panel" style={{ marginBottom: 22 }}>
          <h2 style={{ fontSize: 16 }}>Mensagens recebidas pelo site</h2>
          <ul className="rev">
            {leads.map((l) => (
              <li key={l.id} style={{ flexDirection: "column", alignItems: "flex-start" }}>
                <span><b>{l.name}</b> <span className="mut">· {new Date(l.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span> {l.phone && <a className="wa" href={`https://wa.me/55${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{l.phone}</a>}</span>
                {l.message && <span className="mut">{l.message}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel" style={{ display: "grid", gap: 14, maxWidth: 760 }}>
        <label className="f">Título principal<input value={c.hero.headline} onChange={(e) => set("hero", { ...c.hero, headline: e.target.value })} /></label>
        <label className="f">Subtítulo<input value={c.hero.subheadline} onChange={(e) => set("hero", { ...c.hero, subheadline: e.target.value })} /></label>
        <label className="f">Texto do botão<input value={c.hero.cta} onChange={(e) => set("hero", { ...c.hero, cta: e.target.value })} /></label>
        <label className="f">Sobre<textarea rows={4} value={c.about.text} onChange={(e) => set("about", { ...c.about, text: e.target.value })} /></label>
        <label className="f">Serviços (um por linha: Título — descrição)<textarea rows={5} value={servicesText} onChange={(e) => setServicesText(e.target.value)} /></label>
        <label className="f">WhatsApp (com DDD, só números)<input value={c.business.whatsapp} onChange={(e) => set("business", { ...c.business, whatsapp: e.target.value.replace(/\D/g, "") })} /></label>
        <label className="f">Layout (trocar não gasta crédito)
          <select value={site.template} onChange={async (e) => {
            const template = e.target.value as LayoutKey;
            const { error } = await supabase.from("sites").update({ template }).eq("id", id);
            if (!error) { setSite({ ...site, template }); loadExtras(); }
            flash(error ? "Erro ao trocar o layout" : "Layout alterado");
          }}>
            <option value="classico">Clássico</option><option value="moderno">Moderno</option><option value="vitrine">Vitrine</option>
          </select>
        </label>
        <label className="f">Cor principal<input type="color" value={c.theme.accent} onChange={(e) => set("theme", themeFromAccent(e.target.value))} style={{ height: 42, padding: 4 }} /></label>

        <details className="f extras" open>
          <summary>Imagens das seções</summary>
          <div className="fgrid" style={{ marginTop: 10 }}>
            <div className="f">Logo<ImageSlot label="Enviar logo" url={c.logoUrl} onClear={() => set("logoUrl", undefined)} onFile={async (f) => { const r = await uploadImage(f, "logo"); if (r.url) setC({ ...c, logoUrl: r.url, theme: r.accent ? themeFromAccent(r.accent) : c.theme }); else flash(r.error ?? "Erro"); }} /></div>
            <div className="f">Foto de capa<ImageSlot label="Enviar foto" url={media.hero} onClear={() => setMedia({ hero: undefined })} onFile={(f) => putImage(f, (u) => setMedia({ hero: u }))} /></div>
            <div className="f">Foto da seção Sobre<ImageSlot label="Enviar foto" url={media.sobre} onClear={() => setMedia({ sobre: undefined })} onFile={(f) => putImage(f, (u) => setMedia({ sobre: u }))} /></div>
            <div className="f">Imagem da promoção<ImageSlot label="Enviar imagem" url={media.promo} onClear={() => setMedia({ promo: undefined })} onFile={(f) => putImage(f, (u) => setMedia({ promo: u }))} /></div>
            {teamLines.length > 0 && <div className="f wide">Foto de cada pessoa da equipe<div className="itemslots">{teamLines.map((m, i) => <div key={i} className="itemslot"><span>{m.name}</span><ImageSlot small label="+ Foto" url={media.equipe?.[i]} onClear={() => setItem("equipe", i, "")} onFile={(f) => putImage(f, (u) => setItem("equipe", i, u))} /></div>)}</div></div>}
            {catLines.length > 0 && <div className="f wide">Foto de cada item do cardápio<div className="itemslots">{catLines.map((m, i) => <div key={i} className="itemslot"><span>{m.name}</span><ImageSlot small label="+ Foto" url={media.catalogo?.[i]} onClear={() => setItem("catalogo", i, "")} onFile={(f) => putImage(f, (u) => setItem("catalogo", i, u))} /></div>)}</div></div>}
          </div>
        </details>

        <details className="f extras">
          <summary>Extras opcionais</summary>
          <div className="fgrid" style={{ marginTop: 10 }}>
            <label className="f">Anos de história<input inputMode="numeric" value={ex.years} onChange={(e) => setEx({ ...ex, years: e.target.value.replace(/\D/g, "") })} /></label>
            <label className="f">Promoção — título<input value={ex.promoTitle} onChange={(e) => setEx({ ...ex, promoTitle: e.target.value })} /></label>
            <label className="f wide">Promoção — descrição<input value={ex.promoText} onChange={(e) => setEx({ ...ex, promoText: e.target.value })} /></label>
            <label className="f wide">Planos e preços (Nome — R$ preço — descrição)<textarea rows={3} value={ex.plans} onChange={(e) => setEx({ ...ex, plans: e.target.value })} /></label>
            <label className="f wide">Cardápio / catálogo (Item — R$ preço — descrição)<textarea rows={3} value={ex.catalog} onChange={(e) => setEx({ ...ex, catalog: e.target.value })} /></label>
            <label className="f wide">Como funciona (Título — descrição)<textarea rows={3} value={ex.steps} onChange={(e) => setEx({ ...ex, steps: e.target.value })} /></label>
            <label className="f wide">Diferenciais (Título — descrição)<textarea rows={3} value={ex.differentials} onChange={(e) => setEx({ ...ex, differentials: e.target.value })} /></label>
            <label className="f wide">Equipe (Nome — função)<textarea rows={3} value={ex.team} onChange={(e) => setEx({ ...ex, team: e.target.value })} /></label>
          </div>
        </details>

        <div className="f">Seções do site (ligar/desligar e mudar a ordem)
          <ul className="seclist">
            {secs.map((sc, i) => (
              <li key={sc.key} className={sc.on ? "" : "off"}>
                <label><input type="checkbox" checked={sc.on} onChange={() => setSecs(secs.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} /> {SECTION_LABELS[sc.key]}{!hasData(sc.key, previewContent) && <em className="mut"> · sem dados (não aparece)</em>}</label>
                <span>
                  <button type="button" className="ghost sm" disabled={i === 0} onClick={() => setSecs(move(secs, i, -1))} aria-label="Subir">↑</button>
                  <button type="button" className="ghost sm" disabled={i === secs.length - 1} onClick={() => setSecs(move(secs, i, 1))} aria-label="Descer">↓</button>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="ghost sm" onClick={() => setSecs(resolveSections({ ...c, sections: undefined }, layoutOf(site.template, c)))}>Restaurar ordem do layout</button>
        </div>

        <div className="row">
          <button onClick={() => save()}>Salvar</button>
          <a href={url} target="_blank" rel="noreferrer"><button type="button" className="ghost">Abrir prévia</button></a>
          {site.status === "previa" && <button className="ghost" onClick={publish}>Publicar site</button>}
        </div>
      </div>

      {site.status === "publicado" && (
        <div className="panel" style={{ marginTop: 22, maxWidth: 760 }}>
          <h2 style={{ fontSize: 16 }}>Domínio próprio</h2>
          <p className="mut" style={{ marginTop: 0 }}>Coloque o domínio do cliente (ex.: <code>www.cliente.com.br</code>). Depois de salvar, aponte o DNS como indicado abaixo.</p>
          <div className="row"><input style={{ flex: 1, minWidth: 220 }} placeholder="www.cliente.com.br" value={domain} onChange={(e) => setDomain(e.target.value.trim().toLowerCase())} /><button onClick={saveDomain} disabled={!domain}>Salvar domínio</button></div>
          {domainInfo && <p className="mut" style={{ whiteSpace: "pre-line" }}>{domainInfo}</p>}
        </div>
      )}

      {versions.length > 0 && (
        <div className="panel" style={{ marginTop: 22, maxWidth: 760 }}>
          <h2 style={{ fontSize: 16 }}>Histórico de versões</h2>
          <ul className="rev">
            {versions.map((v) => (
              <li key={v.id}><span>{new Date(v.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} <span className="mut">· {v.content.hero.headline.slice(0, 50)}</span></span><button className="ghost sm" onClick={() => restore(v)}>Restaurar</button></li>
            ))}
          </ul>
        </div>
      )}
      {msg && <div className="toast">{msg}</div>}
    </>
  );
}
