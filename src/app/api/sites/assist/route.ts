import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SKILL } from "@/lib/site/assistant/skill";

const MAX_TURNS = 12;

type Msg = { role: "user" | "assistant"; text: string };
type Draft = { layout?: string; nome?: string; categoria?: string; telefone?: boolean; endereco?: boolean; horarios?: number; servicos?: number; logo?: boolean; fotos?: number; cores?: boolean };

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["reply", "pronto_para_gerar"],
  properties: { reply: { type: "string" }, pronto_para_gerar: { type: "boolean" } },
} as const;

const STEPS = ["modelo", "cliente", "dados", "revisao"];

// Sem chave da IA, o roteiro fixo continua conduzindo o usuário.
function fallback(step: string, d: Draft) {
  const falta = [!d.logo && "logo", !d.horarios && "horários", !d.servicos && "serviços", !d.telefone && "telefone"].filter(Boolean) as string[];
  if (step === "modelo") return "Escolha o modelo do site. Moderno combina com academias e barbearias, Clássico com clínicas e serviços, Vitrine com restaurantes e salões.";
  if (step === "cliente") return "Agora o cliente: escolha um da sua lista ou cadastre manualmente. O telefone vira o botão de WhatsApp do site.";
  if (step === "dados") return falta.length ? `Revise os dados. Ainda falta: ${falta.join(", ")}. O logo define as cores da marca do site.` : "Dados completos. Revise os textos e siga para a revisão.";
  return "Tudo pronto para revisar. Confira a prévia ao lado e, estando bom, gere o site (3 créditos).";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const messages: Msg[] = Array.isArray(body?.messages) ? body.messages.slice(-24) : [];
  const step = STEPS.includes(body?.step) ? (body.step as string) : "modelo";
  const draft: Draft = typeof body?.draft === "object" && body.draft ? body.draft : {};
  const turns = messages.filter((m) => m.role === "user").length;
  if (turns > MAX_TURNS) return NextResponse.json({ reply: "Já conversamos bastante. Siga com as etapas ao lado e gere o site quando estiver pronto.", pronto_para_gerar: step === "revisao" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !messages.length) return NextResponse.json({ reply: fallback(step, draft), pronto_para_gerar: false });

  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: "claude-sonnet-5-5", max_tokens: 600, system: SKILL,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      messages: [
        ...messages.slice(-10).map((m, i, a) => ({ role: m.role, content: i === a.length - 1 && m.role === "user" ? `Estado do sistema: ${JSON.stringify({ etapa: step, rascunho: draft, turno: turns })}\n\nMensagem do usuário: ${m.text}` : m.text })),
      ],
    } as never);
    const block = (res as { content: { type: string; text?: string }[] }).content.find((b) => b.type === "text");
    const out = JSON.parse(block?.text ?? "{}");
    if (out.reply) return NextResponse.json({ reply: String(out.reply).slice(0, 800), pronto_para_gerar: Boolean(out.pronto_para_gerar) && step === "revisao" });
  } catch { /* usa o roteiro fixo */ }
  return NextResponse.json({ reply: fallback(step, draft), pronto_para_gerar: false });
}
