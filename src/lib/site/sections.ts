import type { LayoutKey, SectionCfg, SectionKey, SiteContent } from "./types";

export const SECTION_LABELS: Record<SectionKey, string> = {
  numeros: "Números em destaque", sobre: "Sobre", servicos: "Serviços", diferenciais: "Diferenciais", comofunciona: "Como funciona",
  planos: "Planos e preços", catalogo: "Cardápio / catálogo", promo: "Promoção", equipe: "Equipe", galeria: "Galeria de fotos",
  depoimentos: "Depoimentos", faq: "Perguntas frequentes", cta: "Chamada para o WhatsApp", formulario: "Formulário de contato", contato: "Contato e mapa",
};

export const ALL_SECTIONS: SectionKey[] = ["numeros", "sobre", "servicos", "diferenciais", "comofunciona", "planos", "catalogo", "promo", "equipe", "galeria", "depoimentos", "faq", "cta", "formulario", "contato"];

// Ordem padrão de cada layout: cada um conta a história do negócio de um jeito.
const ORDER: Record<LayoutKey, SectionKey[]> = {
  classico: ["sobre", "diferenciais", "servicos", "equipe", "planos", "depoimentos", "galeria", "faq", "formulario", "contato"],
  moderno: ["numeros", "sobre", "servicos", "comofunciona", "planos", "galeria", "depoimentos", "faq", "formulario", "contato"],
  vitrine: ["servicos", "promo", "catalogo", "cta", "galeria", "depoimentos", "sobre", "faq", "formulario", "contato"],
};

export function defaultSections(layout: LayoutKey): SectionCfg[] {
  const first = ORDER[layout];
  return [...first.map((key) => ({ key, on: true })), ...ALL_SECTIONS.filter((k) => !first.includes(k)).map((key) => ({ key, on: false }))];
}

// Se o usuário personalizou, usa a lista dele (completando o que faltar); senão, a ordem do layout.
export function resolveSections(c: SiteContent, layout: LayoutKey): SectionCfg[] {
  if (!c.sections?.length) return defaultSections(layout);
  const known = c.sections.filter((s) => ALL_SECTIONS.includes(s.key));
  return [...known, ...ALL_SECTIONS.filter((k) => !known.some((s) => s.key === k)).map((key) => ({ key, on: false }))];
}

export function numbersOf(c: SiteContent) {
  const out: { value: number; label: string; dec?: number }[] = [];
  if (c.business.rating) out.push({ value: c.business.rating, label: "nota no Google", dec: 1 });
  if (c.business.ratingCount) out.push({ value: c.business.ratingCount, label: "avaliações" });
  if (c.years) out.push({ value: c.years, label: "anos de história" });
  const open = c.hours.filter((h) => !/fechado/i.test(h)).length;
  if (open >= 2) out.push({ value: open, label: "dias de atendimento por semana" });
  return out;
}

// Diferenciais só com fatos dos dados (nada inventado); o usuário pode substituir no editor.
export function differentialsOf(c: SiteContent) {
  if (c.differentials?.length) return c.differentials;
  const out: { title: string; text: string }[] = [];
  if (c.business.rating) out.push({ title: `Nota ${c.business.rating} no Google`, text: c.business.ratingCount ? `Reconhecida por ${c.business.ratingCount} avaliações de clientes.` : "Avaliada por clientes reais." });
  if (c.business.whatsapp) out.push({ title: "Atendimento pelo WhatsApp", text: "Fale direto com a equipe, sem complicação." });
  if (c.business.address) out.push({ title: "Localização de fácil acesso", text: c.business.address });
  const open = c.hours.filter((h) => !/fechado/i.test(h)).length;
  if (open >= 5) out.push({ title: `Aberto ${open} dias por semana`, text: "Horários pensados para a sua rotina." });
  return out.slice(0, 4);
}

// Fotos disponíveis para a galeria: a primeira vira capa quando não há foto de capa própria.
export const poolOf = (c: SiteContent) => (c.photos?.length ?? 0) - (!c.media?.hero && (c.photos?.length ?? 0) > 0 ? 1 : 0);

export function hasData(key: SectionKey, c: SiteContent): boolean {
  switch (key) {
    case "numeros": return numbersOf(c).length > 0;
    case "sobre": return Boolean(c.about.text);
    case "servicos": return c.services.items.length > 0;
    case "diferenciais": return differentialsOf(c).length > 0;
    case "comofunciona": return Boolean(c.steps?.length);
    case "planos": return Boolean(c.plans?.length);
    case "catalogo": return Boolean(c.catalog?.length);
    case "promo": return Boolean(c.promo?.title);
    case "equipe": return Boolean(c.team?.length);
    case "galeria": return poolOf(c) > 0;
    case "depoimentos": return c.reviews.items.length > 0;
    case "faq": return Boolean(c.faq?.length);
    case "cta": return Boolean(c.business.whatsapp);
    case "formulario": return true;
    case "contato": return true;
  }
}

// Formato de digitação: uma linha por item, campos separados por " — ".
export const parseLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
export const parsePairs = (s: string) => parseLines(s).map((l) => { const [a, ...r] = l.split("—"); return { title: a.trim(), text: r.join("—").trim() }; }).filter((x) => x.title);
export const parsePrices = (s: string) => parseLines(s).map((l) => { const [name = "", price = "", ...r] = l.split("—").map((x) => x.trim()); return { name, price, text: r.join(" — ") }; }).filter((x) => x.name);
export const parseTeam = (s: string) => parseLines(s).map((l) => { const [name, ...r] = l.split("—"); return { name: name.trim(), role: r.join("—").trim() }; }).filter((x) => x.name);
export const fmtPairs = (a?: { title: string; text: string }[]) => (a ?? []).map((x) => `${x.title} — ${x.text}`).join("\n");
export const fmtPrices = (a?: { name: string; price: string; text: string }[]) => (a ?? []).map((x) => [x.name, x.price, x.text].filter((v, i) => i < 2 || v).join(" — ")).join("\n");
export const fmtTeam = (a?: { name: string; role: string }[]) => (a ?? []).map((x) => `${x.name} — ${x.role}`).join("\n");

// Aplica os campos extras recebidos (wizard/editor) ao conteúdo, com limites de tamanho.
export function applyExtras(c: SiteContent, x: Record<string, unknown> | undefined): SiteContent {
  if (!x) return c;
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
  const out = { ...c };
  if (typeof x.years === "number" && x.years > 0 && x.years < 200) out.years = Math.round(x.years);
  const pairs = (v: unknown) => (Array.isArray(v) ? v.slice(0, 8).map((i) => ({ title: str((i as { title?: string }).title, 80), text: str((i as { text?: string }).text, 200) })).filter((i) => i.title) : undefined);
  const prices = (v: unknown) => (Array.isArray(v) ? v.slice(0, 12).map((i) => ({ name: str((i as { name?: string }).name, 80), price: str((i as { price?: string }).price, 30), text: str((i as { text?: string }).text, 160) })).filter((i) => i.name) : undefined);
  const sv = pairs(x.steps); if (sv?.length) out.steps = sv;
  const df = pairs(x.differentials); if (df?.length) out.differentials = df;
  const pl = prices(x.plans); if (pl?.length) out.plans = pl;
  const ct = prices(x.catalog); if (ct?.length) out.catalog = ct;
  if (Array.isArray(x.team)) { const t = x.team.slice(0, 8).map((i) => ({ name: str((i as { name?: string }).name, 80), role: str((i as { role?: string }).role, 80) })).filter((i) => i.name); if (t.length) out.team = t; }
  const url = (v: unknown) => (typeof v === "string" && /^https:\/\//.test(v) && v.length <= 500 ? v : undefined);
  const list = (v: unknown, n: number) => (Array.isArray(v) ? v.slice(0, n).map((u) => url(u) ?? "") : undefined);
  const m = x.media as { hero?: unknown; sobre?: unknown; promo?: unknown; equipe?: unknown; catalogo?: unknown } | undefined;
  if (m) {
    const media: NonNullable<SiteContent["media"]> = {};
    if (url(m.hero)) media.hero = url(m.hero); if (url(m.sobre)) media.sobre = url(m.sobre); if (url(m.promo)) media.promo = url(m.promo);
    const eq = list(m.equipe, 8); if (eq?.some(Boolean)) media.equipe = eq; const ca = list(m.catalogo, 12); if (ca?.some(Boolean)) media.catalogo = ca;
    if (Object.keys(media).length) out.media = media;
  }
  if (Array.isArray(x.sections)) {
    const valid = (x.sections as { key?: unknown; on?: unknown }[]).filter((s) => typeof s.key === "string" && (ALL_SECTIONS as string[]).includes(s.key)).map((s) => ({ key: s.key as SectionKey, on: Boolean(s.on) }));
    if (valid.length) out.sections = valid;
  }
  const pr = x.promo as { title?: string; text?: string } | undefined;
  if (pr?.title) out.promo = { title: str(pr.title, 80), text: str(pr.text, 200) };
  return out;
}
