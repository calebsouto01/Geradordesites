"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LayoutKey, SectionKey, SiteContent, SiteRow } from "@/lib/site/types";
import { themeFromAccent } from "@/lib/site/palette-client";
import { SECTION_LABELS, fmtPairs, fmtPrices, fmtTeam, hasData, parsePairs, parsePrices, parseTeam, resolveSections } from "@/lib/site/sections";
import { layoutOf } from "@/components/SiteRender";

const move = <T,>(a: T[], i: number, d: number) => { const b = [...a]; [b[i], b[i + d]] = [b[i + d], b[i]]; return b; };

export default function EditarSite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();
  const [site, setSite] = useState<SiteRow | null>(null);
  const [c, setC] = useState<SiteContent | null>(null);
  const [servicesText, setServicesText] = useState("");
  const [msg, setMsg] = useState("");
  const [ex, setEx] = useState({ years: "", steps: "", differentials: "", plans: "", catalog: "", team: "", promoTitle: "", promoText: "" });
  const [secs, setSecs] = useState<{ key: SectionKey; on: boolean }[]>([]);

  useEffect(() => {
    supabase.from("sites").select("*").eq("id", id).single().then(({ data }) => {
      if (!data) return;
      const row = data as SiteRow;
      setSite(row); setC(row.content);
      setServicesText(row.content.services.items.map((s) => `${s.title} — ${s.text}`).join("\n"));
      const k = row.content;
      setEx({ years: k.years ? String(k.years) : "", steps: fmtPairs(k.steps), differentials: fmtPairs(k.differentials), plans: fmtPrices(k.plans), catalog: fmtPrices(k.catalog), team: fmtTeam(k.team), promoTitle: k.promo?.title ?? "", promoText: k.promo?.text ?? "" });
      setSecs(resolveSections(k, layoutOf(row.template, k)));
    });
  }, [supabase, id]);

  if (!site || !c) return <p className="mut">Carregando…</p>;

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };

  async function save() {
    const items = servicesText.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
      const [title, ...rest] = l.split("—");
      return { title: title.trim(), text: rest.join("—").trim() };
    });
    const content: SiteContent = {
      ...c!, services: { ...c!.services, items }, years: Number(ex.years) || undefined,
      steps: parsePairs(ex.steps), differentials: parsePairs(ex.differentials), plans: parsePrices(ex.plans), catalog: parsePrices(ex.catalog), team: parseTeam(ex.team),
      promo: ex.promoTitle.trim() ? { title: ex.promoTitle.trim(), text: ex.promoText.trim() } : undefined, sections: secs,
    };
    if (!content.steps?.length) delete content.steps; if (!content.differentials?.length) delete content.differentials;
    if (!content.plans?.length) delete content.plans; if (!content.catalog?.length) delete content.catalog; if (!content.team?.length) delete content.team;
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
            {secs.map((sc, i) => {
              const preview: SiteContent = { ...c, years: Number(ex.years) || undefined, steps: parsePairs(ex.steps), plans: parsePrices(ex.plans), catalog: parsePrices(ex.catalog), team: parseTeam(ex.team), promo: ex.promoTitle.trim() ? { title: ex.promoTitle, text: ex.promoText } : undefined };
              const has = hasData(sc.key, preview);
              return (
                <li key={sc.key} className={sc.on ? "" : "off"}>
                  <label><input type="checkbox" checked={sc.on} onChange={() => setSecs(secs.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))} /> {SECTION_LABELS[sc.key]}{!has && <em className="mut"> · sem dados (não aparece)</em>}</label>
                  <span>
                    <button type="button" className="ghost sm" disabled={i === 0} onClick={() => setSecs(move(secs, i, -1))} aria-label="Subir">↑</button>
                    <button type="button" className="ghost sm" disabled={i === secs.length - 1} onClick={() => setSecs(move(secs, i, 1))} aria-label="Descer">↓</button>
                  </span>
                </li>
              );
            })}
          </ul>
          <button type="button" className="ghost sm" onClick={() => setSecs(resolveSections({ ...c, sections: undefined }, layoutOf(site.template, c)))}>Restaurar ordem do layout</button>
        </div>
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
