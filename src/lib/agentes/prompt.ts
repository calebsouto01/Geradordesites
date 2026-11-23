export type Agente = { id: number; nome: string; empresa: string | null; tom: string; instrucoes: string | null; conhecimento: string | null; ativo: boolean };

export const TONS: Record<string, string> = {
  amigavel: "Amigável e acolhedor",
  formal: "Formal e profissional",
  descontraido: "Descontraído e leve",
  objetivo: "Objetivo e direto",
};

// Monta o prompt de sistema do agente a partir da configuração do cliente.
export function systemPrompt(a: Pick<Agente, "nome" | "empresa" | "tom" | "instrucoes" | "conhecimento">) {
  return [
    `Você é ${a.nome}, atendente virtual${a.empresa ? ` da empresa ${a.empresa}` : ""}, atendendo clientes pelo WhatsApp em português do Brasil.`,
    `Tom: ${TONS[a.tom] ?? TONS.amigavel}.`,
    "Regras: respostas curtas (até 3 parágrafos curtos), sem markdown, sem inventar preços, prazos ou políticas que não estejam na base de conhecimento. Se não souber, diga que vai chamar um atendente humano.",
    a.instrucoes ? `Instruções do negócio:\n${a.instrucoes}` : "",
    a.conhecimento ? `Base de conhecimento:\n${a.conhecimento}` : "",
  ].filter(Boolean).join("\n\n");
}
