import type { Profile, SiteContent } from "./types";

type Preset = {
  key: string; match: RegExp; accent: string;
  headline: (n: string) => string; sub: (n: string) => string; cta: string; about: (n: string) => string;
  services: { title: string; text: string }[];
};

const PRESETS: Preset[] = [
  {
    key: "academia", match: /academia|fitness|muscula|crossfit|pilates|treino/i, accent: "#ef4444",
    headline: (n) => `${n}: seu treino começa aqui`,
    sub: () => "Estrutura completa, professores atentos e um ambiente que motiva você a voltar todos os dias.",
    cta: "Agendar aula experimental",
    about: (n) => `A ${n} é um espaço pensado para quem quer cuidar da saúde com acompanhamento de perto. Aqui você encontra equipamentos, orientação profissional e uma turma que faz a diferença na sua rotina.`,
    services: [
      { title: "Musculação", text: "Equipamentos completos e orientação para cada objetivo." },
      { title: "Aulas em grupo", text: "Turmas animadas em diferentes horários." },
      { title: "Acompanhamento", text: "Professores presentes para ajustar seu treino." },
    ],
  },
  {
    key: "salao", match: /sal[aã]o|beleza|barbear|cabelei|est[eé]tica|unha|manicure|barbearia/i, accent: "#d946ef",
    headline: (n) => `${n}: realce o seu melhor`,
    sub: () => "Atendimento cuidadoso, produtos de qualidade e resultado que valoriza o seu estilo.",
    cta: "Agendar horário",
    about: (n) => `No ${n} cada atendimento é pensado para você se sentir bem. Trabalhamos com cuidado, higiene e atenção aos detalhes, do corte ao acabamento.`,
    services: [
      { title: "Cabelo", text: "Cortes, coloração e tratamentos." },
      { title: "Unhas e estética", text: "Cuidados que combinam com você." },
      { title: "Atendimento com hora marcada", text: "Sem espera e com toda a atenção." },
    ],
  },
  {
    key: "saude", match: /odont|dent|cl[ií]nica|fisio|psic|m[eé]dic|sa[uú]de/i, accent: "#0ea5e9",
    headline: (n) => `${n}: cuidado que você pode confiar`,
    sub: () => "Atendimento humanizado, profissionais qualificados e um ambiente acolhedor.",
    cta: "Marcar consulta",
    about: (n) => `A ${n} atende com atenção, ética e respeito ao seu tempo. Nosso objetivo é que você se sinta seguro em cada etapa do cuidado.`,
    services: [
      { title: "Avaliação inicial", text: "Entendemos o seu caso antes de qualquer procedimento." },
      { title: "Tratamentos", text: "Opções pensadas para o que você precisa." },
      { title: "Acompanhamento", text: "Retornos e orientações para manter os resultados." },
    ],
  },
  {
    key: "comida", match: /restaurante|lanchonete|pizzaria|padaria|caf[eé]|hamb|comida|bar\b|sorvet/i, accent: "#f59e0b",
    headline: (n) => `${n}: sabor que faz voltar`,
    sub: () => "Ingredientes escolhidos com carinho e um atendimento que faz você se sentir em casa.",
    cta: "Fazer pedido ou reserva",
    about: (n) => `A ${n} reúne boa comida e ambiente acolhedor. Venha conhecer, ou peça pelo WhatsApp e receba com a qualidade de sempre.`,
    services: [
      { title: "Cardápio", text: "Pratos preparados na hora." },
      { title: "Pedidos pelo WhatsApp", text: "Rápido e sem complicação." },
      { title: "Reservas", text: "Garanta a sua mesa." },
    ],
  },
];

const GENERIC: Preset = {
  key: "generico", match: /.*/, accent: "#6366f1",
  headline: (n) => `${n}: qualidade que você reconhece`,
  sub: () => "Atendimento próximo, compromisso com o resultado e a confiança de quem já avaliou muito bem.",
  cta: "Falar no WhatsApp",
  about: (n) => `A ${n} atende com dedicação e cuidado em cada detalhe. Fale com a gente e veja como podemos ajudar você.`,
  services: [
    { title: "Atendimento personalizado", text: "Entendemos o que você precisa." },
    { title: "Qualidade", text: "Compromisso com o resultado." },
    { title: "Fale direto com a gente", text: "Resposta rápida pelo WhatsApp." },
  ],
};

export function whatsappFrom(phone?: string) {
  const d = (phone ?? "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

export function pickPreset(category?: string) {
  return PRESETS.find((p) => p.match.test(category ?? "")) ?? GENERIC;
}

// Gerador por regras: usa só o que existe nos dados; onde não há, usa texto neutro editável.
export function generateContent(p: Profile): { content: SiteContent; template: string } {
  const preset = pickPreset(p.category);
  const query = encodeURIComponent(`${p.name} ${p.address ?? ""}`.trim());
  const good = (p.reviews ?? []).filter((r) => r.rating >= 4 && r.text.length > 20).slice(0, 3);
  const content: SiteContent = {
    business: {
      name: p.name, category: p.category ?? "", address: p.address ?? "", phone: p.phone ?? "",
      whatsapp: whatsappFrom(p.phone), rating: p.rating ?? null, ratingCount: p.ratingCount ?? null,
      mapsUrl: p.mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${query}`,
    },
    theme: { accent: preset.accent },
    hero: { headline: preset.headline(p.name), subheadline: preset.sub(p.name), cta: preset.cta },
    about: { title: `Sobre a ${p.name}`, text: p.summary || preset.about(p.name) },
    services: { title: "O que oferecemos", items: preset.services },
    reviews: { title: "O que dizem nossos clientes", items: good },
    hours: p.hours ?? [],
  };
  return { content, template: preset.key };
}

export function makeSlug(name: string) {
  const base = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${base || "site"}-${Math.random().toString(36).slice(2, 6)}`;
}
