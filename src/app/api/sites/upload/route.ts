import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPalette } from "@/lib/site/palette";

const TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX = 5 * 1024 * 1024;

// Recebe logo ou foto (base64), valida, guarda no Storage e devolve a URL e as cores da marca.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const mediaType = String(body?.mediaType ?? "");
  const kind = body?.kind === "logo" ? "logo" : "foto";
  if (!TYPES.includes(mediaType)) return NextResponse.json({ error: "Envie uma imagem PNG, JPG ou WebP." }, { status: 400 });
  const buf = Buffer.from(String(body?.data ?? ""), "base64");
  if (!buf.length || buf.length > MAX) return NextResponse.json({ error: "A imagem deve ter até 5 MB." }, { status: 400 });

  const theme = kind === "logo" ? await extractPalette(buf).catch(() => null) : null;
  const supabase = createClient();
  const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${mediaType.split("/")[1]}`;
  const up = await supabase.storage.from("uploads").upload(path, buf, { contentType: mediaType });
  if (up.error) return NextResponse.json({ error: "Não foi possível guardar a imagem." }, { status: 500 });
  return NextResponse.json({ url: supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl, theme });
}
