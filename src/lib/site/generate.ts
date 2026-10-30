import { themeFromAccent } from "./palette-client";
import type { LayoutKey, Profile, SiteContent } from "./types";

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
  {
    key: "oficina", match: /oficina|mec[aâ]nic|auto ?(center|pe[cç]as|el[eé]tric)|funilaria|borracharia|lava[- ]?jato|autom[oó]vel|automotiv|carro|moto/i, accent: "#d99a00",
    headline: (n) => `${n}: seu carro em boas mãos`,
    sub: () => "Conte o modelo do carro e o que ele está apresentando, e receba orientação clara antes de decidir.",
    cta: "Falar no WhatsApp",
    about: (n) => `A ${n} cuida da manutenção do seu veículo com atenção ao detalhe e conversa direta. Explique o problema e a oficina orienta o melhor caminho.`,
    services: [
      { title: "Revisão e manutenção", text: "Converse sobre o que vale revisar no seu carro." },
      { title: "Freios e suspensão", text: "Barulho, vibração ou desgaste: peça uma avaliação." },
      { title: "Motor e elétrica", text: "Luz de alerta ou ruído diferente? Conte o que acontece." },
    ],
  },
  {
    key: "pet", match: /pet|veterin|animal|banho e tosa|ra[cç][aã]o/i, accent: "#14b8a6",
    headline: (n) => `${n}: cuidado de verdade pelo seu pet`,
    sub: () => "Atenção, carinho e profissionais que tratam o seu bichinho como parte da família.",
    cta: "Agendar pelo WhatsApp",
    about: (n) => `A ${n} cuida do seu pet com carinho e responsabilidade. Fale com a equipe e conte do que ele precisa.`,
    services: [
      { title: "Atendimento", text: "Cuidado atento para cada animal." },
      { title: "Banho e tosa", text: "Pergunte sobre horários e porte." },
      { title: "Produtos", text: "Peça orientação para o que o seu pet precisa." },
    ],
  },
  {
    key: "juridico", match: /advog|jur[ií]dic|contab|escrit[oó]rio|despachante|imobili[aá]ri|corretor/i, accent: "#1e3a8a",
    headline: (n) => `${n}: orientação clara para decidir com segurança`,
    sub: () => "Atendimento direto, linguagem simples e acompanhamento do início ao fim.",
    cta: "Falar com a equipe",
    about: (n) => `A ${n} atende com ética e clareza. Conte a sua situação e receba orientação sobre os próximos passos.`,
    services: [
      { title: "Primeira conversa", text: "Entendemos o seu caso antes de qualquer decisão." },
      { title: "Acompanhamento", text: "Você sabe em que etapa está." },
      { title: "Atendimento pelo WhatsApp", text: "Tire dúvidas sem burocracia." },
    ],
  },
  {
    key: "educacao", match: /escola|curso|idioma|ingl[eê]s|refor[cç]o|educa|faculdade|treinamento|aula/i, accent: "#7c3aed",
    headline: (n) => `${n}: aprender com acompanhamento de perto`,
    sub: () => "Turmas e atendimento pensados para você evoluir no seu ritmo.",
    cta: "Quero saber mais",
    about: (n) => `A ${n} acompanha cada aluno de perto. Fale com a equipe para conhecer turmas, horários e formas de começar.`,
    services: [
      { title: "Turmas e horários", text: "Pergunte qual encaixa na sua rotina." },
      { title: "Acompanhamento", text: "Atenção ao seu progresso." },
      { title: "Matrícula", text: "Tire dúvidas e comece pelo WhatsApp." },
    ],
  },
  {
    key: "loja", match: /loja|com[eé]rcio|boutique|vestu[aá]rio|moda|cal[cç]ado|[oó]tica|papelaria|m[oó]veis|material de constru|farm[aá]cia|variedades/i, accent: "#e11d48",
    headline: (n) => `${n}: tudo o que você procura, perto de você`,
    sub: () => "Produtos selecionados e atendimento que ajuda você a escolher bem.",
    cta: "Falar no WhatsApp",
    about: (n) => `A ${n} atende com atenção e conhece o que vende. Pergunte pelo WhatsApp sobre produtos e disponibilidade.`,
    services: [
      { title: "Produtos", text: "Pergunte pelo que você procura." },
      { title: "Atendimento", text: "Ajuda para escolher com calma." },
      { title: "Compra pelo WhatsApp", text: "Rápido e sem complicação." },
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

export function suggestLayout(category?: string): LayoutKey {
  const k = pickPreset(category).key;
  return k === "academia" ? "moderno" : k === "salao" || k === "comida" ? "vitrine" : "classico";
}

export function pickPreset(category?: string) {
  return PRESETS.find((p) => p.match.test(category ?? "")) ?? GENERIC;
}

// Gerador por regras: usa só o que existe nos dados; onde não há, usa texto neutro editável.
export function generateContent(p: Profile, layout?: LayoutKey): { content: SiteContent; template: LayoutKey } {
  const preset = pickPreset(p.category);
  const query = encodeURIComponent(`${p.name} ${p.address ?? ""}`.trim());
  const good = (p.reviews ?? []).filter((r) => r.rating >= 4 && r.text.length > 20).slice(0, 3);
  const content: SiteContent = {
    business: {
      name: p.name, category: p.category ?? "", address: p.address ?? "", phone: p.phone ?? "",
      whatsapp: whatsappFrom(p.phone), rating: p.rating ?? null, ratingCount: p.ratingCount ?? null,
      mapsUrl: p.mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${query}`,
    },
    theme: themeFromAccent(preset.accent),
    photos: p.photos ?? [],
    faq: [
      ...(p.address ? [{ q: "Onde fica?", a: p.address }] : []),
      ...(p.hours?.length ? [{ q: "Qual o horário de funcionamento?", a: p.hours.join(" · ") }] : []),
      ...(p.phone ? [{ q: "Como falar com vocês?", a: `Pelo WhatsApp ou telefone ${p.phone}.` }] : []),
    ],
    hero: { headline: preset.headline(p.name), subheadline: preset.sub(p.name), cta: preset.cta },
    about: { title: `Sobre a ${p.name}`, text: p.summary || preset.about(p.name) },
    services: { title: "O que oferecemos", items: preset.services },
    reviews: { title: "O que dizem nossos clientes", items: good },
    hours: p.hours ?? [],
  };
  return { content, template: layout ?? suggestLayout(p.category) };
}

export function makeSlug(name: string) {
  const base = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${base || "site"}-${Math.random().toString(36).slice(2, 6)}`;
}
