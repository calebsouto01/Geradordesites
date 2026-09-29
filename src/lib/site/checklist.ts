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
