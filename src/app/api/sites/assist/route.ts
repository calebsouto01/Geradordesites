import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { SKILL } from "@/lib/site/assistant/skill";
import { checklist } from "@/lib/site/checklist";
import { extractPalette } from "@/lib/site/palette";
import { fetchPlaceProfile } from "@/lib/site/places";
import { generateContent, suggestLayout } from "@/lib/site/generate";
import type { Profile } from "@/lib/site/types";

const MAX_TURNS = 12;
const MAX_IMAGE = 5 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

type Msg = { role: "user" | "assistant"; text: string };

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["reply", "pronto_para_gerar"],
  properties: {
    reply: { type: "string" },
    layout: { type: "string", enum: ["classico", "moderno", "vitrine"] },
    servicos: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "text"], properties: { title: { type: "string" }, text: { type: "string" } } } },
    horarios: { type: "array", items: { type: "string" } },
    pronto_para_gerar: { type: "boolean" },
  },
} as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const leadId = Number(body?.leadId);
  const messages: Msg[] = Array.isArray(body?.messages) ? body.messages.slice(-24) : [];
  const image = body?.image as { mediaType: string; data: string } | undefined;
  if (!Number.isInteger(leadId)) return NextResponse.json({ error: "Lead inválido." }, { status: 400 });
  if (messages.filter((m) => m.role === "user").length > MAX_TURNS)
    return NextResponse.json({ reply: "Já conversamos bastante. Posso gerar o site com o que temos?", pronto_para_gerar: true });

  const supabase = createClient();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  const base: Profile = lead.profile ?? { name: lead.name, address: lead.address ?? undefined, phone: lead.phone ?? undefined };
  const profile = !lead.profile && lead.place_id ? await fetchPlaceProfile(lead.place_id, base) : base;
  const { content } = generateContent(profile);

  // Imagem enviada: valida, extrai a paleta (base numérica) e guarda o arquivo no Storage.
  let theme = null, imageUrl: string | undefined, buf: Buffer | undefined;
  if (image) {
    if (!TYPES.includes(image.mediaType)) return NextResponse.json({ error: "Envie uma imagem PNG, JPG ou WebP." }, { status: 400 });
    buf = Buffer.from(image.data ?? "", "base64");
    if (!buf.length || buf.length > MAX_IMAGE) return NextResponse.json({ error: "A imagem deve ter até 5 MB." }, { status: 400 });
    theme = await extractPalette(buf).catch(() => null);
    const path = `${leadId}/${Date.now()}.${image.mediaType.split("/")[1]}`;
    const up = await supabase.storage.from("uploads").upload(path, buf, { contentType: image.mediaType });
    if (!up.error) imageUrl = supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl;
  }

  const missing = checklist(content);
  const fallback = {
    reply: image
      ? theme ? `Recebi a imagem e identifiquei as cores da marca (${theme.accent}). Uso essas cores no site?` : "Recebi a imagem, mas não achei cores marcantes. Vou usar o padrão da categoria."
      : missing[0]?.ask ?? "Tenho o que preciso. Posso gerar o site?",
    pronto_para_gerar: !image && missing.length === 0,
    layout: suggestLayout(profile.category),
  };

  const key = process.env.ANTHROPIC_API_KEY;
  let out: { reply: string; layout?: string; servicos?: { title: string; text: string }[]; horarios?: string[]; pronto_para_gerar: boolean } = fallback;
  if (key) {
    try {
      const client = new Anthropic({ apiKey: key });
      const state = {
        negocio: { nome: profile.name, categoria: profile.category, nota: profile.rating, avaliacoes: profile.ratingCount, fotos: profile.photos?.length ?? 0, horarios: profile.hours?.length ?? 0 },
        falta: missing.map((m) => m.key), layout_sugerido: suggestLayout(profile.category), cores_extraidas: theme?.accent ?? null,
        turno: messages.filter((m) => m.role === "user").length + 1,
      };
      const userContent: unknown[] = [{ type: "text", text: `Estado do sistema: ${JSON.stringify(state)}` }];
      if (image && buf) userContent.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
      const res = await client.messages.create({
        model: "claude-sonnet-5-5", max_tokens: 800, system: SKILL,
        output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
        messages: [
          ...messages.slice(-10).map((m) => ({ role: m.role, content: m.text })),
          { role: "user", content: userContent },
        ],
      } as never);
      const block = (res as { content: { type: string; text?: string }[] }).content.find((b) => b.type === "text");
      const parsed = JSON.parse(block?.text ?? "{}");
      if (parsed.reply) out = parsed;
    } catch { /* mantém o roteiro determinístico */ }
  }

  return NextResponse.json({
    reply: out.reply, layout: out.layout, servicos: out.servicos, horarios: out.horarios, pronto_para_gerar: out.pronto_para_gerar,
    theme, imageUrl, missing: missing.map((m) => m.key),
    summary: { name: profile.name, photos: profile.photos?.length ?? 0, rating: profile.rating ?? null, hasHours: (profile.hours?.length ?? 0) > 0 },
  });
}
