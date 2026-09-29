"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AssistantPanel, { type DraftSummary, type Step } from "@/components/site/AssistantPanel";
import { generateContent, suggestLayout } from "@/lib/site/generate";
import { themeFromAccent } from "@/lib/site/palette-client";
import { ALL_SECTIONS, SECTION_LABELS, applyExtras, defaultSections, hasData, parsePairs, parsePrices, parseTeam } from "@/lib/site/sections";
import type { LayoutKey, Profile, SectionCfg, SectionKey, SiteContent } from "@/lib/site/types";

type Lead = { id: number; name: string; phone: string | null; address: string | null };
type Media = { hero: string; sobre: string; promo: string; equipe: string[]; catalogo: string[] };
type Data = {
  name: string; category: string; address: string; phone: string; hours: string; servicos: string; about: string; accent: string; logoUrl: string; photos: string[];
  years: string; steps: string; differentials: string; plans: string; catalog: string; team: string; promoTitle: string; promoText: string;
  media: Media; aiCopy: boolean; aiBrief: string;
};

const STEPS: { key: Step; label: string }[] = [
  { key: "cliente", label: "Cliente" }, { key: "modelo", label: "Modelo" }, { key: "secoes", label: "Seções" }, { key: "dados", label: "Dados" }, { key: "revisao", label: "Revisão" },
];

const LAYOUTS: { key: LayoutKey; label: string; hint: string; ideal: string }[] = [
  { key: "classico", label: "Clássico", hint: "Claro, sóbrio e de leitura fácil", ideal: "Clínicas, escritórios, serviços" },
  { key: "moderno", label: "Moderno", hint: "Escuro, ousado, com destaque em cor", ideal: "Academias, barbearias, estúdios" },
  { key: "vitrine", label: "Vitrine", hint: "Cartões grandes e coloridos", ideal: "Restaurantes, salões, comércio" },
];

const WHAT: Record<SectionKey, string> = {
  numeros: "Nota, avaliações e anos de história (automático).", sobre: "Texto sobre o negócio. Aceita uma foto.", servicos: "Lista dos serviços ou produtos.",
  diferenciais: "Automático a partir dos dados; você pode escrever os seus.", comofunciona: "Passo a passo em 3 ou 4 etapas.", planos: "Planos e preços.",
  catalogo: "Cardápio ou catálogo. Aceita foto por item.", promo: "Uma promoção em destaque. Aceita imagem.", equipe: "Quem atende. Aceita foto por pessoa.",
  galeria: "Fotos do espaço (as do Google entram ao gerar).", depoimentos: "Avaliações reais do Google.", faq: "Perguntas frequentes (automáticas).", cta: "Faixa para chamar no WhatsApp.", contato: "Endereço, horários e mapa.",
};

const emptyMedia = (): Media => ({ hero: "", sobre: "", promo: "", equipe: [], catalogo: [] });
const EMPTY: Data = {
  name: "", category: "", address: "", phone: "", hours: "", servicos: "", about: "", accent: "#6366f1", logoUrl: "", photos: [],
  years: "", steps: "", differentials: "", plans: "", catalog: "", team: "", promoTitle: "", promoText: "", media: emptyMedia(), aiCopy: true, aiBrief: "",
};

const DEMO_PROFILE = {
  name: "Academia Vida Ativa (caso fictício)", category: "Academia", address: "Rua das Palmeiras, 120 — Centro, Fortaleza — CE",
  phone: "(85) 90000-0000", rating: 4.8, ratingCount: 213,
  hours: ["segunda-feira: 05:30–22:00", "terça-feira: 05:30–22:00", "quarta-feira: 05:30–22:00", "quinta-feira: 05:30–22:00", "sexta-feira: 05:30–21:00", "sábado: 08:00–13:00", "domingo: Fechado"],
  reviews: [
    { author: "Cliente A", rating: 5, text: "Professores atenciosos e equipamentos sempre em ótimo estado. Recomendo demais!" },
    { author: "Cliente B", rating: 5, text: "Ambiente limpo e acolhedor, os horários de aula cabem na minha rotina." },
  ],
};

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const toBase64 = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.onerror = rej; r.readAsDataURL(f); });

const extrasOf = (d: Data, secs: SectionCfg[]) => ({
  years: Number(d.years) || undefined, steps: parsePairs(d.steps), differentials: parsePairs(d.differentials),
  plans: parsePrices(d.plans), catalog: parsePrices(d.catalog), team: parseTeam(d.team),
  promo: d.promoTitle.trim() ? { title: d.promoTitle.trim(), text: d.promoText.trim() } : undefined,
  media: { hero: d.media.hero, sobre: d.media.sobre, promo: d.media.promo, equipe: d.media.equipe, catalogo: d.media.catalogo },
  sections: secs,
});

function Thumb({ k }: { k: LayoutKey }) {
  return (
    <div className={`thumb t-${k}`} aria-hidden>
      <i className="th-nav" /><i className="th-hero" /><b className="th-h" /><b className="th-p" />
      <span className="th-row"><i /><i /><i /></span>
    </div>
  );
}

function ImageSlot({ label, url, onFile, onClear, small }: { label: string; url?: string; onFile: (f: File) => void; onClear: () => void; small?: boolean }) {
  return (
    <div className={`imgslot ${small ? "sm" : ""}`}>
      {url ? <div className="tb"><img src={url} alt="" /><button type="button" onClick={onClear} aria-label="Remover">✕</button></div> : null}
      <label className="upl">{url ? "Trocar" : label}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onFile(f); }} /></label>
    </div>
  );
}

type Check = { label: string; status: "ok" | "warn" | "off"; detail: string; fix?: Step };

export default function NovoSite() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState<Step>("cliente");
  const [layout, setLayout] = useState<LayoutKey | null>(null);
  const [suggested, setSuggested] = useState<LayoutKey | null>(null);
  const [secs, setSecs] = useState<SectionCfg[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mode, setMode] = useState<"lista" | "manual">("lista");
  const [q, setQ] = useState("");
  const [leadId, setLeadId] = useState<number | null>(null);
  const [manual, setManual] = useState({ name: "", category: "", phone: "", address: "" });
  const [base, setBase] = useState<Profile | null>(null);
  const [data, setData] = useState<Data>(EMPTY);
  const [auto, setAuto] = useState({ about: "", servicos: "" });
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [assistOpen, setAssistOpen] = useState(false);
  const iframe = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    supabase.from("leads").select("id, name, phone, address").order("created_at", { ascending: false }).then(({ data: l }) => setLeads((l as Lead[]) ?? []));
    const id = Number(new URLSearchParams(window.location.search).get("lead"));
    if (Number.isInteger(id) && id > 0) { setLeadId(id); setMode("lista"); }
  }, [supabase]);

  // Ao trocar de modelo, as seções voltam ao padrão daquele modelo.
  useEffect(() => { if (layout) setSecs(defaultSections(layout)); }, [layout]);

  const set = <K extends keyof Data>(k: K, v: Data[K]) => setData((d) => ({ ...d, [k]: v }));
  const setMedia = <K extends keyof Media>(k: K, v: Media[K]) => setData((d) => ({ ...d, media: { ...d.media, [k]: v } }));
  const idx = STEPS.findIndex((s) => s.key === step);
  const chosen = leads.find((l) => l.id === leadId);
  const on = (k: SectionKey) => secs.some((s) => s.key === k && s.on);

  // Rascunho para a prévia, a conferência e o resumo do assistente.
  const draft = useMemo(() => {
    if (!base || !layout) return null;
    const p: Profile = { ...base, name: data.name || base.name, category: data.category, address: data.address, phone: data.phone, hours: lines(data.hours), photos: [] };
    const { content, template } = generateContent(p, layout);
    let c: SiteContent = { ...content, theme: themeFromAccent(data.accent), about: { ...content.about, text: data.about || content.about.text } };
    const sv = parsePairs(data.servicos);
    if (sv.length) c.services = { ...c.services, items: sv };
    if (data.logoUrl) c.logoUrl = data.logoUrl;
    c.photos = data.photos.map((url) => ({ name: "", url, width: 0, height: 0, author: "Enviada pelo cliente" }));
    c = applyExtras(c, extrasOf(data, secs));
    return { content: c, template };
  }, [base, data, layout, secs]);

  useEffect(() => {
    if (step !== "revisao" || !draft) return;
    try { sessionStorage.setItem("draftSite", JSON.stringify(draft)); iframe.current?.contentWindow?.postMessage("update", "*"); } catch { /* sem prévia */ }
  }, [step, draft]);

  async function upload(file: File, kind: "logo" | "foto"): Promise<{ url: string; accent?: string } | null> {
    setErr("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setErr("Envie uma imagem PNG, JPG ou WebP."); return null; }
    if (file.size > 5 * 1024 * 1024) { setErr("A imagem deve ter até 5 MB."); return null; }
    setBusy(true);
    const res = await fetch("/api/sites/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, mediaType: file.type, data: await toBase64(file) }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(json.error ?? "Erro ao enviar a imagem."); return null; }
    return { url: json.url, accent: json.theme?.accent };
  }
  const putSlot = async (f: File, apply: (url: string) => void) => { const r = await upload(f, "foto"); if (r) apply(r.url); };
  const setItem = (k: "equipe" | "catalogo", i: number, url: string) => setData((d) => { const a = [...d.media[k]]; a[i] = url; return { ...d, media: { ...d.media, [k]: a } }; });

  async function loadProfile(id: number) {
    const res = await fetch(`/api/sites/prefill?leadId=${id}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(json.error ?? "Não foi possível carregar os dados do cliente."); return false; }
    const p = json.profile as Profile;
    const gen = generateContent(p).content;
    const servicos = gen.services.items.map((s) => `${s.title} — ${s.text}`).join("\n");
    setBase(p); setLoadedFor(id); setAuto({ about: gen.about.text, servicos });
    setData({ ...EMPTY, media: emptyMedia(), name: p.name ?? "", category: p.category ?? "", address: p.address ?? "", phone: p.phone ?? "", hours: (p.hours ?? []).join("\n"), servicos, about: gen.about.text, accent: gen.theme.accent });
    const sug = suggestLayout(p.category);
    setSuggested(sug); setLayout((l) => l ?? sug);
    return true;
  }

  async function next() {
    setErr("");
    if (step === "cliente") {
      let id = leadId;
      if (mode === "lista") { if (!id) return setErr("Escolha um cliente da lista."); }
      else {
        if (!manual.name.trim()) return setErr("Informe o nome do negócio.");
        setBusy(true);
        const profile = { name: manual.name.trim(), category: manual.category.trim() || undefined, address: manual.address.trim() || undefined, phone: manual.phone.trim() || undefined };
        const { data: row, error } = await supabase.from("leads").insert({ name: profile.name, phone: profile.phone ?? null, address: profile.address ?? null, origin: "Cadastro manual", profile }).select("id").single();
        setBusy(false);
        if (error || !row) return setErr("Não foi possível cadastrar o cliente.");
        id = row.id; setLeadId(id);
      }
      if (id !== loadedFor) { setBusy(true); const ok = await loadProfile(id!); setBusy(false); if (!ok) return; }
      return setStep("modelo");
    }
    if (step === "modelo") { if (!layout) return setErr("Escolha um modelo para continuar."); return setStep("secoes"); }
    if (step === "secoes") return setStep("dados");
    if (step === "dados") { if (!data.name.trim()) return setErr("O nome do negócio é obrigatório."); return setStep("revisao"); }
  }

  async function generate() {
    if (!leadId || !layout) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/sites/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId, layout, theme: themeFromAccent(data.accent), logoUrl: data.logoUrl || undefined, extraPhotos: data.photos,
        // só envia o texto se o usuário editou; senão a IA (ou o texto padrão) escreve
        servicos: data.servicos !== auto.servicos ? parsePairs(data.servicos) : undefined,
        about: data.about !== auto.about ? data.about : undefined,
        horarios: lines(data.hours), extras: extrasOf(data, secs),
        profile: { name: data.name, category: data.category, address: data.address, phone: data.phone },
        aiCopy: data.aiCopy, aiBrief: data.aiBrief,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(json.error ?? "Erro ao gerar o site.");
    router.push(`/sites/${json.site.id}`);
  }

  const shown = leads.filter((l) => l.name.toLowerCase().includes(q.toLowerCase()));

  async function createDemo() {
    const { data: row, error } = await supabase.from("leads").insert({ name: DEMO_PROFILE.name, phone: DEMO_PROFILE.phone, address: DEMO_PROFILE.address, origin: "Caso de teste", profile: DEMO_PROFILE }).select("id, name, phone, address").single();
    if (error || !row) return setErr("Não foi possível criar o caso de teste.");
    setLeads((l) => [row as Lead, ...l]); setLeadId(row.id); setMode("lista");
  }

  const fixed = layout ? defaultSections(layout).filter((s) => s.on).map((s) => s.key) : [];
  const others = ALL_SECTIONS.filter((k) => !fixed.includes(k));
  const toggle = (k: SectionKey) => setSecs((l) => l.map((s) => (s.key === k ? { ...s, on: !s.on } : s)));
  const teamLines = parseTeam(data.team), catLines = parsePrices(data.catalog);

  // Conferência completa: cada seção ativa, imagens, contato, marca, texto e créditos.
  const checks: Check[] = useMemo(() => {
    if (!draft) return [];
    const c = draft.content, out: Check[] = [];
    out.push({ label: "Nome do negócio", status: c.business.name ? "ok" : "warn", detail: c.business.name || "obrigatório", fix: "dados" });
    out.push({ label: "WhatsApp / telefone", status: c.business.whatsapp ? "ok" : "warn", detail: c.business.whatsapp ? data.phone : "sem telefone, o botão de WhatsApp não aparece", fix: "dados" });
    out.push({ label: "Endereço e mapa", status: c.business.address ? "ok" : "warn", detail: c.business.address || "sem endereço, o mapa não aparece", fix: "dados" });
    out.push({ label: "Horários", status: c.hours.length ? "ok" : "warn", detail: c.hours.length ? `${c.hours.length} linha(s)` : "sem horários no contato", fix: "dados" });
    out.push({ label: "Logo e cores da marca", status: data.logoUrl ? "ok" : "off", detail: data.logoUrl ? `logo enviado, cor ${data.accent}` : `sem logo, usa a cor ${data.accent}`, fix: "dados" });
    out.push({ label: "Foto de capa", status: data.media.hero ? "ok" : "off", detail: data.media.hero ? "enviada" : "usa a 1ª foto do Google, se houver", fix: "dados" });
    for (const s of secs.filter((x) => x.on)) {
      const has = hasData(s.key, c);
      let detail = has ? "com dados" : "sem dados, não vai aparecer";
      if (s.key === "servicos") detail = `${c.services.items.length} serviço(s)`;
      if (s.key === "planos") detail = has ? `${c.plans?.length} plano(s)` : detail;
      if (s.key === "catalogo") detail = has ? `${c.catalog?.length} item(ns), ${data.media.catalogo.filter(Boolean).length} com foto` : detail;
      if (s.key === "equipe") detail = has ? `${c.team?.length} pessoa(s), ${data.media.equipe.filter(Boolean).length} com foto` : detail;
      if (s.key === "sobre") detail = data.media.sobre ? "com foto" : "sem foto (opcional)";
      if (s.key === "promo") detail = has ? (data.media.promo ? "com imagem" : "sem imagem (opcional)") : detail;
      if (s.key === "galeria") detail = has ? `${data.photos.length} foto(s) enviada(s); as do Google entram ao gerar` : "só com as fotos do Google, se houver";
      if (s.key === "depoimentos") detail = has ? `${c.reviews.items.length} avaliação(ões) do Google` : "entram do Google ao gerar (se houver)";
      out.push({ label: SECTION_LABELS[s.key], status: has || s.key === "galeria" || s.key === "depoimentos" ? "ok" : "warn", detail, fix: has ? undefined : "dados" });
    }
    out.push({ label: "Copy do site", status: "ok", detail: data.aiCopy ? `IA escreve${data.aiBrief.trim() ? " com o seu briefing" : ""}` : "texto padrão por regras (sem IA)", fix: "dados" });
    out.push({ label: "Custo", status: "ok", detail: "3 créditos ao gerar" });
    return out;
  }, [draft, secs, data]);
  const warns = checks.filter((c) => c.status === "warn").length;

  const summary: DraftSummary = {
    secoes: draft ? secs.filter((s) => s.on && hasData(s.key, draft.content)).length : 0,
    layout: LAYOUTS.find((l) => l.key === layout)?.label, nome: data.name || chosen?.name, categoria: data.category,
    telefone: Boolean(data.phone), endereco: Boolean(data.address), horarios: lines(data.hours).length, servicos: parsePairs(data.servicos).length,
    logo: Boolean(data.logoUrl), fotos: data.photos.length + (data.media.hero ? 1 : 0), cores: Boolean(data.logoUrl),
  };

  return (
    <>
      <div className="pagehead">
        <Link href="/sites" className="mut">← Meus sites</Link>
        <h1>Criar site</h1>
      </div>

      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s.key} className={i === idx ? "on" : i < idx ? "done" : ""}><span>{i < idx ? "✓" : i + 1}</span><b>{s.label}</b></li>
        ))}
      </ol>

      <div className="wiz">
        <div className="wizmain">
          {/* 1 · CLIENTE */}
          {step === "cliente" && (
            <div className="panel">
              <div className="seg">
                <button type="button" className={mode === "lista" ? "on" : ""} onClick={() => setMode("lista")}>Da minha lista</button>
                <button type="button" className={mode === "manual" ? "on" : ""} onClick={() => setMode("manual")}>Cadastrar manualmente</button>
              </div>
              {mode === "lista" ? (
                <>
                  <input placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginTop: 14 }} />
                  <div className="clist">
                    {shown.map((l) => (
                      <button key={l.id} type="button" className={`citem ${leadId === l.id ? "on" : ""}`} onClick={() => setLeadId(l.id)}>
                        <b>{l.name}</b><span className="mut">{l.address ?? l.phone ?? "Sem endereço"}</span>
                      </button>
                    ))}
                    {!shown.length && <p className="mut">Nenhum cliente encontrado. Cadastre manualmente ou promova um resultado na Busca.</p>}
                  </div>
                  <button type="button" className="ghost sm" onClick={createDemo}>+ Usar caso de teste (fictício)</button>
                </>
              ) : (
                <div className="fgrid" style={{ marginTop: 14 }}>
                  <label className="f">Nome do negócio *<input value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} /></label>
                  <label className="f">Categoria<input placeholder="Ex.: academia, salão, clínica" value={manual.category} onChange={(e) => setManual({ ...manual, category: e.target.value })} /></label>
                  <label className="f">Telefone / WhatsApp<input inputMode="tel" placeholder="(85) 90000-0000" value={manual.phone} onChange={(e) => setManual({ ...manual, phone: e.target.value })} /></label>
                  <label className="f">Endereço<input value={manual.address} onChange={(e) => setManual({ ...manual, address: e.target.value })} /></label>
                </div>
              )}
            </div>
          )}

          {/* 2 · MODELO */}
          {step === "modelo" && (
            <>
              {suggested && <p className="mut" style={{ margin: 0 }}>Sugestão para {data.category || "este negócio"}: <b>{LAYOUTS.find((l) => l.key === suggested)?.label}</b>. Você pode escolher outro.</p>}
              <div className="tplgrid">
                {LAYOUTS.map((l) => (
                  <button key={l.key} type="button" className={`tpl ${layout === l.key ? "on" : ""}`} onClick={() => setLayout(l.key)}>
                    <Thumb k={l.key} />
                    <b>{l.label}{suggested === l.key ? " · sugerido" : ""}</b><span>{l.hint}</span><small className="mut">Ideal para: {l.ideal}</small>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 3 · SEÇÕES */}
          {step === "secoes" && layout && (
            <div className="panel">
              <h2 style={{ fontSize: 16 }}>Seções do modelo {LAYOUTS.find((l) => l.key === layout)?.label}</h2>
              <p className="mut" style={{ marginTop: 0 }}>Estas vêm fixas com o modelo. Seções sem dados não aparecem no site.</p>
              <ul className="seclist fixedlist">
                {fixed.map((k) => <li key={k}><label><input type="checkbox" checked disabled /> {SECTION_LABELS[k]} <span className="lock" title="Fixa no modelo">🔒</span></label><small className="mut">{WHAT[k]}</small></li>)}
              </ul>
              <h2 style={{ fontSize: 16, marginTop: 18 }}>Adicionar outras seções</h2>
              <p className="mut" style={{ marginTop: 0 }}>Marque as que quiser incluir; você preenche os dados no próximo passo.</p>
              <ul className="seclist">
                {others.map((k) => (
                  <li key={k} className={on(k) ? "" : "off"}>
                    <label><input type="checkbox" checked={on(k)} onChange={() => toggle(k)} /> {SECTION_LABELS[k]}</label><small className="mut">{WHAT[k]}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4 · DADOS (só das seções escolhidas) */}
          {step === "dados" && (
            <div className="panel">
              <div className="fgrid">
                <h3 className="wide grp">Dados do negócio</h3>
                <label className="f">Nome do negócio *<input value={data.name} onChange={(e) => set("name", e.target.value)} /></label>
                <label className="f">Categoria<input value={data.category} onChange={(e) => set("category", e.target.value)} /></label>
                <label className="f">Telefone / WhatsApp<input inputMode="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} /></label>
                <label className="f">Endereço<input value={data.address} onChange={(e) => set("address", e.target.value)} /></label>

                <h3 className="wide grp">Marca e capa</h3>
                <div className="f">Logo (define as cores da marca)
                  <ImageSlot label="Enviar logo, fachada ou print" url={data.logoUrl} onClear={() => set("logoUrl", "")} onFile={async (f) => { const r = await upload(f, "logo"); if (r) setData((d) => ({ ...d, logoUrl: r.url, accent: r.accent ?? d.accent })); }} />
                </div>
                <label className="f">Cor principal<input type="color" value={data.accent} onChange={(e) => set("accent", e.target.value)} style={{ height: 44, padding: 4 }} /></label>
                <div className="f wide">Foto de capa (topo do site)
                  <ImageSlot label="Enviar foto de capa" url={data.media.hero} onClear={() => setMedia("hero", "")} onFile={(f) => putSlot(f, (u) => setMedia("hero", u))} />
                </div>

                {on("sobre") && (<>
                  <h3 className="wide grp">Sobre</h3>
                  <label className="f wide">Texto sobre o negócio<textarea rows={3} value={data.about} onChange={(e) => set("about", e.target.value)} /></label>
                  <div className="f wide">Foto da seção Sobre (opcional)
                    <ImageSlot label="Enviar foto" url={data.media.sobre} onClear={() => setMedia("sobre", "")} onFile={(f) => putSlot(f, (u) => setMedia("sobre", u))} />
                  </div>
                </>)}

                {on("servicos") && (<>
                  <h3 className="wide grp">Serviços</h3>
                  <label className="f wide">Um por linha: Título — descrição<textarea rows={4} value={data.servicos} onChange={(e) => set("servicos", e.target.value)} /></label>
                </>)}

                {on("numeros") && (<>
                  <h3 className="wide grp">Números em destaque</h3>
                  <label className="f">Anos de história (opcional)<input inputMode="numeric" value={data.years} onChange={(e) => set("years", e.target.value.replace(/\D/g, ""))} /></label>
                </>)}

                {on("diferenciais") && (<>
                  <h3 className="wide grp">Diferenciais</h3>
                  <label className="f wide">Título — descrição (deixe vazio para usar os automáticos)<textarea rows={3} value={data.differentials} onChange={(e) => set("differentials", e.target.value)} /></label>
                </>)}

                {on("comofunciona") && (<>
                  <h3 className="wide grp">Como funciona</h3>
                  <label className="f wide">Passos, um por linha: Título — descrição<textarea rows={3} value={data.steps} onChange={(e) => set("steps", e.target.value)} /></label>
                </>)}

                {on("planos") && (<>
                  <h3 className="wide grp">Planos e preços</h3>
                  <label className="f wide">Nome — R$ preço — descrição<textarea rows={3} value={data.plans} onChange={(e) => set("plans", e.target.value)} /></label>
                </>)}

                {on("catalogo") && (<>
                  <h3 className="wide grp">Cardápio / catálogo</h3>
                  <label className="f wide">Item — R$ preço — descrição<textarea rows={3} value={data.catalog} onChange={(e) => set("catalog", e.target.value)} /></label>
                  {catLines.length > 0 && <div className="f wide">Foto de cada item (opcional)
                    <div className="itemslots">{catLines.map((it, i) => <div key={i} className="itemslot"><span>{it.name}</span><ImageSlot small label="+ Foto" url={data.media.catalogo[i]} onClear={() => setItem("catalogo", i, "")} onFile={(f) => putSlot(f, (u) => setItem("catalogo", i, u))} /></div>)}</div>
                  </div>}
                </>)}

                {on("promo") && (<>
                  <h3 className="wide grp">Promoção</h3>
                  <label className="f">Título<input placeholder="Ex.: Matrícula grátis em março" value={data.promoTitle} onChange={(e) => set("promoTitle", e.target.value)} /></label>
                  <label className="f">Descrição<input value={data.promoText} onChange={(e) => set("promoText", e.target.value)} /></label>
                  <div className="f wide">Imagem da promoção (opcional)
                    <ImageSlot label="Enviar imagem" url={data.media.promo} onClear={() => setMedia("promo", "")} onFile={(f) => putSlot(f, (u) => setMedia("promo", u))} />
                  </div>
                </>)}

                {on("equipe") && (<>
                  <h3 className="wide grp">Equipe</h3>
                  <label className="f wide">Nome — função (um por linha)<textarea rows={3} value={data.team} onChange={(e) => set("team", e.target.value)} /></label>
                  {teamLines.length > 0 && <div className="f wide">Foto de cada pessoa (opcional)
                    <div className="itemslots">{teamLines.map((m, i) => <div key={i} className="itemslot"><span>{m.name}</span><ImageSlot small label="+ Foto" url={data.media.equipe[i]} onClear={() => setItem("equipe", i, "")} onFile={(f) => putSlot(f, (u) => setItem("equipe", i, u))} /></div>)}</div>
                  </div>}
                </>)}

                {on("galeria") && (<>
                  <h3 className="wide grp">Galeria de fotos</h3>
                  <div className="f wide">Até 6 fotos
                    <label className="upl">+ Adicionar foto<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) putSlot(f, (u) => set("photos", [...data.photos, u].slice(0, 6))); }} /></label>
                    <div className="thumbs">{data.photos.map((u, i) => <div key={u} className="tb"><img src={u} alt="" /><button type="button" onClick={() => set("photos", data.photos.filter((_, j) => j !== i))} aria-label="Remover">✕</button></div>)}</div>
                    <span className="mut">Se o negócio tem fotos no Google, elas entram automaticamente ao gerar.</span>
                  </div>
                </>)}

                {(on("contato") || on("cta")) && (<>
                  <h3 className="wide grp">Contato</h3>
                  <label className="f wide">Horários (um por linha)<textarea rows={3} value={data.hours} onChange={(e) => set("hours", e.target.value)} /></label>
                </>)}

                <h3 className="wide grp">Texto do site</h3>
                <div className="f wide aibox">
                  <label className="switch"><input type="checkbox" checked={data.aiCopy} onChange={(e) => set("aiCopy", e.target.checked)} /><span className="knob" /><b>Pedir à IA uma copy personalizada</b></label>
                  <span className="mut">{data.aiCopy ? "A IA reescreve título, subtítulo, sobre e serviços usando só os dados acima. O que você editar à mão é mantido." : "Desligado: o site usa o texto padrão por regras, sem chamar a IA."}</span>
                  {data.aiCopy && <textarea rows={3} placeholder="Briefing opcional: tom de voz, público, o que destacar (ex.: descontraído, foco em emagrecimento para mulheres)" value={data.aiBrief} onChange={(e) => set("aiBrief", e.target.value)} />}
                </div>
              </div>
            </div>
          )}

          {/* 5 · REVISÃO */}
          {step === "revisao" && (
            <div className="panel">
              <div className="revgrid">
                <div>
                  <h2 style={{ fontSize: 16 }}>Conferência completa</h2>
                  <p className="mut" style={{ marginTop: 0 }}>{warns ? `${warns} aviso(s) para olhar antes de gerar.` : "Tudo certo para gerar."} Modelo <b>{summary.layout}</b>.</p>
                  <ul className="checks">
                    {checks.map((c, i) => (
                      <li key={i} className={c.status}>
                        <i>{c.status === "ok" ? "✓" : c.status === "warn" ? "⚠" : "○"}</i>
                        <div><b>{c.label}</b><span className="mut">{c.detail}</span></div>
                        {c.fix && c.status !== "ok" && <button type="button" className="ghost sm" onClick={() => setStep(c.fix!)}>Ajustar</button>}
                      </li>
                    ))}
                  </ul>
                  <p className="mut">A prévia usa o texto atual; ao gerar, a IA aplica a copy (se ligada). As fotos do Google aparecem depois de gerar.</p>
                </div>
                <div className="prev"><iframe ref={iframe} src="/preview" title="Prévia do site" /></div>
              </div>
            </div>
          )}

          {err && <p className="err">{err}</p>}

          <div className="wizfoot">
            <button className="ghost" disabled={idx === 0 || busy} onClick={() => { setErr(""); setStep(STEPS[idx - 1].key); }}>← Voltar</button>
            {step !== "revisao"
              ? <button disabled={busy} onClick={next}>{busy ? "Aguarde…" : "Continuar →"}</button>
              : <button disabled={busy} onClick={generate}>{busy ? "Gerando…" : "Gerar site · 3 créditos"}</button>}
          </div>
        </div>

        <AssistantPanel step={step} draft={summary} open={assistOpen} onToggle={() => setAssistOpen((o) => !o)} />
      </div>
    </>
  );
}
