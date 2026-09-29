"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AssistantPanel, { type DraftSummary, type Step } from "@/components/site/AssistantPanel";
import { generateContent, suggestLayout } from "@/lib/site/generate";
import { themeFromAccent } from "@/lib/site/palette-client";
import type { LayoutKey, Profile, SiteContent } from "@/lib/site/types";

type Lead = { id: number; name: string; phone: string | null; address: string | null };
type Data = { name: string; category: string; address: string; phone: string; hours: string; servicos: string; about: string; accent: string; logoUrl: string; photos: string[] };

const STEPS: { key: Step; label: string }[] = [
  { key: "modelo", label: "Modelo" }, { key: "cliente", label: "Cliente" }, { key: "dados", label: "Dados" }, { key: "revisao", label: "Revisão" },
];

const LAYOUTS: { key: LayoutKey; label: string; hint: string; ideal: string }[] = [
  { key: "classico", label: "Clássico", hint: "Claro, sóbrio e de leitura fácil", ideal: "Clínicas, escritórios, serviços" },
  { key: "moderno", label: "Moderno", hint: "Escuro, ousado, com destaque em cor", ideal: "Academias, barbearias, estúdios" },
  { key: "vitrine", label: "Vitrine", hint: "Cartões grandes e coloridos", ideal: "Restaurantes, salões, comércio" },
];

const EMPTY: Data = { name: "", category: "", address: "", phone: "", hours: "", servicos: "", about: "", accent: "#6366f1", logoUrl: "", photos: [] };

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
const parseServices = (s: string) => lines(s).map((l) => { const [t, ...r] = l.split("—"); return { title: t.trim(), text: r.join("—").trim() }; }).filter((x) => x.title);
const toBase64 = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1] ?? ""); r.onerror = rej; r.readAsDataURL(f); });

function Thumb({ k }: { k: LayoutKey }) {
  return (
    <div className={`thumb t-${k}`} aria-hidden>
      <i className="th-nav" /><i className="th-hero" /><b className="th-h" /><b className="th-p" />
      <span className="th-row"><i /><i /><i /></span>
    </div>
  );
}

export default function NovoSite() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState<Step>("modelo");
  const [layout, setLayout] = useState<LayoutKey | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [mode, setMode] = useState<"lista" | "manual">("lista");
  const [q, setQ] = useState("");
  const [leadId, setLeadId] = useState<number | null>(null);
  const [manual, setManual] = useState({ name: "", category: "", phone: "", address: "" });
  const [base, setBase] = useState<Profile | null>(null);
  const [data, setData] = useState<Data>(EMPTY);
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

  const set = <K extends keyof Data>(k: K, v: Data[K]) => setData((d) => ({ ...d, [k]: v }));
  const idx = STEPS.findIndex((s) => s.key === step);
  const chosen = leads.find((l) => l.id === leadId);

  // Ao entrar em "Dados", carrega o perfil do cliente (Google, caso de teste ou manual).
  useEffect(() => {
    if (step !== "dados" || !leadId || loadedFor === leadId) return;
    (async () => {
      setBusy(true); setErr("");
      const res = await fetch(`/api/sites/prefill?leadId=${leadId}`);
      const json = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok) return setErr(json.error ?? "Não foi possível carregar os dados do cliente.");
      const p = json.profile as Profile;
      setBase(p); setLoadedFor(leadId);
      const auto = generateContent(p, layout ?? undefined).content;
      setData({
        name: p.name ?? "", category: p.category ?? "", address: p.address ?? "", phone: p.phone ?? "",
        hours: (p.hours ?? []).join("\n"), servicos: auto.services.items.map((s) => `${s.title} — ${s.text}`).join("\n"),
        about: auto.about.text, accent: auto.theme.accent, logoUrl: "", photos: [],
      });
    })();
  }, [step, leadId, loadedFor, layout]);

  // Rascunho para a prévia e para o resumo do assistente.
  const draft = useMemo(() => {
    if (!base || !layout) return null;
    const p: Profile = { ...base, name: data.name || base.name, category: data.category, address: data.address, phone: data.phone, hours: lines(data.hours), photos: [] };
    const { content, template } = generateContent(p, layout);
    const c: SiteContent = { ...content, theme: themeFromAccent(data.accent), about: { ...content.about, text: data.about || content.about.text } };
    const sv = parseServices(data.servicos);
    if (sv.length) c.services = { ...c.services, items: sv };
    if (data.logoUrl) c.logoUrl = data.logoUrl;
    c.photos = data.photos.map((url) => ({ name: "", url, width: 0, height: 0, author: "Enviada pelo cliente" }));
    return { content: c, template };
  }, [base, data, layout]);

  useEffect(() => {
    if (step !== "revisao" || !draft) return;
    try { sessionStorage.setItem("draftSite", JSON.stringify(draft)); iframe.current?.contentWindow?.postMessage("update", "*"); } catch { /* sem prévia */ }
  }, [step, draft]);

  const summary: DraftSummary = {
    layout: LAYOUTS.find((l) => l.key === layout)?.label, nome: data.name || chosen?.name, categoria: data.category,
    telefone: Boolean(data.phone), endereco: Boolean(data.address), horarios: lines(data.hours).length, servicos: parseServices(data.servicos).length,
    logo: Boolean(data.logoUrl), fotos: data.photos.length, cores: Boolean(data.logoUrl),
  };

  async function upload(file: File, kind: "logo" | "foto") {
    setErr("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setErr("Envie uma imagem PNG, JPG ou WebP.");
    if (file.size > 5 * 1024 * 1024) return setErr("A imagem deve ter até 5 MB.");
    setBusy(true);
    const res = await fetch("/api/sites/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, mediaType: file.type, data: await toBase64(file) }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(json.error ?? "Erro ao enviar a imagem.");
    if (kind === "logo") { setData((d) => ({ ...d, logoUrl: json.url, accent: json.theme?.accent ?? d.accent })); }
    else setData((d) => ({ ...d, photos: [...d.photos, json.url].slice(0, 6) }));
  }

  async function next() {
    setErr("");
    if (step === "modelo") { if (!layout) return setErr("Escolha um modelo para continuar."); return setStep("cliente"); }
    if (step === "cliente") {
      if (mode === "lista") { if (!leadId) return setErr("Escolha um cliente da lista."); return setStep("dados"); }
      if (!manual.name.trim()) return setErr("Informe o nome do negócio.");
      setBusy(true);
      const profile = { name: manual.name.trim(), category: manual.category.trim() || undefined, address: manual.address.trim() || undefined, phone: manual.phone.trim() || undefined };
      const { data: row, error } = await supabase.from("leads").insert({ name: profile.name, phone: profile.phone ?? null, address: profile.address ?? null, origin: "Cadastro manual", profile }).select("id").single();
      setBusy(false);
      if (error || !row) return setErr("Não foi possível cadastrar o cliente.");
      setLeadId(row.id); setLoadedFor(null); return setStep("dados");
    }
    if (step === "dados") {
      if (!data.name.trim()) return setErr("O nome do negócio é obrigatório.");
      return setStep("revisao");
    }
  }

  async function generate() {
    if (!leadId || !layout) return;
    setBusy(true); setErr("");
    const res = await fetch("/api/sites/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId, layout, theme: themeFromAccent(data.accent), logoUrl: data.logoUrl || undefined, extraPhotos: data.photos,
        servicos: parseServices(data.servicos), horarios: lines(data.hours), about: data.about,
        profile: { name: data.name, category: data.category, address: data.address, phone: data.phone },
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
    if (!layout) setLayout(suggestLayout("Academia"));
  }

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
          {step === "modelo" && (
            <div className="tplgrid">
              {LAYOUTS.map((l) => (
                <button key={l.key} type="button" className={`tpl ${layout === l.key ? "on" : ""}`} onClick={() => setLayout(l.key)}>
                  <Thumb k={l.key} />
                  <b>{l.label}</b><span>{l.hint}</span><small className="mut">Ideal para: {l.ideal}</small>
                </button>
              ))}
            </div>
          )}

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

          {step === "dados" && (
            <div className="panel">
              {busy && !base ? <p className="mut">Carregando os dados do cliente…</p> : (
                <div className="fgrid">
                  <label className="f">Nome do negócio *<input value={data.name} onChange={(e) => set("name", e.target.value)} /></label>
                  <label className="f">Categoria<input value={data.category} onChange={(e) => set("category", e.target.value)} /></label>
                  <label className="f">Telefone / WhatsApp<input inputMode="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} /></label>
                  <label className="f">Endereço<input value={data.address} onChange={(e) => set("address", e.target.value)} /></label>
                  <label className="f wide">Sobre o negócio<textarea rows={3} value={data.about} onChange={(e) => set("about", e.target.value)} /></label>
                  <label className="f wide">Serviços (um por linha: Título — descrição)<textarea rows={4} value={data.servicos} onChange={(e) => set("servicos", e.target.value)} /></label>
                  <label className="f wide">Horários (um por linha)<textarea rows={3} value={data.hours} onChange={(e) => set("hours", e.target.value)} /></label>
                  <div className="f">Logo (define as cores da marca)
                    <label className="upl">{data.logoUrl ? "Trocar logo" : "Enviar logo, fachada ou print"}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f, "logo"); }} /></label>
                    {data.logoUrl && <img className="logoprev" src={data.logoUrl} alt="Logo" />}
                  </div>
                  <label className="f">Cor principal
                    <input type="color" value={data.accent} onChange={(e) => set("accent", e.target.value)} style={{ height: 44, padding: 4 }} />
                  </label>
                  <div className="f wide">Fotos do negócio (até 6)
                    <label className="upl">+ Adicionar foto<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f, "foto"); }} /></label>
                    <div className="thumbs">{data.photos.map((u, i) => <div key={u} className="tb"><img src={u} alt="" /><button type="button" onClick={() => set("photos", data.photos.filter((_, j) => j !== i))} aria-label="Remover">✕</button></div>)}</div>
                    <span className="mut">Se o negócio tem fotos no Google, elas entram automaticamente ao gerar.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "revisao" && (
            <div className="panel">
              <div className="revgrid">
                <div>
                  <h2 style={{ fontSize: 16 }}>Resumo</h2>
                  <ul className="rev">
                    <li><span className="mut">Modelo</span><b>{summary.layout}</b></li>
                    <li><span className="mut">Cliente</span><b>{data.name}</b></li>
                    <li><span className="mut">Telefone</span><b>{data.phone || "—"}</b></li>
                    <li><span className="mut">Serviços</span><b>{summary.servicos}</b></li>
                    <li><span className="mut">Horários</span><b>{summary.horarios ? `${summary.horarios} linhas` : "—"}</b></li>
                    <li><span className="mut">Logo</span><b>{data.logoUrl ? "Enviado" : "Não enviado"}</b></li>
                    <li><span className="mut">Cor</span><b><i className="sw" style={{ background: data.accent }} /> {data.accent}</b></li>
                  </ul>
                  <p className="mut">A prévia usa o texto atual. Ao gerar, a IA refina a escrita mantendo apenas os dados acima. As fotos do Google aparecem depois de gerar.</p>
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
