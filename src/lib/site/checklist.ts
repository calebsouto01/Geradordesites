import type { SiteContent } from "./types";

export type Missing = { key: "logo" | "fotos" | "horarios" | "servicos" | "cores"; ask: string };

// Roteiro determinístico: o que ainda falta para o site ficar bom, na ordem de perguntas.
export function checklist(c: SiteContent): Missing[] {
  const out: Missing[] = [];
  const src = c.sources ?? {};
  if (!c.logoUrl && !src.cores)
    out.push({ key: "logo", ask: "Não localizei o logo. Pode enviar o logo, uma foto da fachada ou um print do Instagram com as cores da marca?" });
  if ((c.photos?.length ?? 0) < 3)
    out.push({ key: "fotos", ask: "Achei poucas fotos do negócio. Quer enviar mais algumas (fachada, interior, produtos)?" });
  if (!c.hours.length)
    out.push({ key: "horarios", ask: "Não encontrei os horários de funcionamento. Quais são?" });
  if (!src.servicos)
    out.push({ key: "servicos", ask: "Quais são os principais serviços ou produtos? Pode mandar um print do cardápio ou da lista de serviços." });
  return out;
}

// Nota de 0 a 100 do que o site entrega hoje, com o motivo de cada desconto. Avisa o usuário antes de enviar ao cliente.
export function quality(c: SiteContent): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  const photos = c.photos?.length ?? 0;
  if (!c.media?.hero && photos === 0) { score -= 35; issues.push("Sem foto: o topo do site fica só com cor. Envie fotos do cliente ou configure a chave do Google."); }
  else if (photos < 3 && !c.media?.hero) { score -= 15; issues.push("Poucas fotos: a galeria fica curta."); }
  if (!c.reviews.items.length) { score -= 10; issues.push("Sem depoimentos reais: a seção de avaliações não aparece."); }
  if (!c.hours.length) { score -= 10; issues.push("Sem horário de funcionamento."); }
  if (!c.logoUrl && !(c.sources ?? {}).cores) { score -= 5; issues.push("Sem logo: as cores seguem o ramo ou a foto."); }
  return { score: Math.max(0, score), issues };
}
