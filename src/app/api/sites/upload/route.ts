import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { extractPalette } from "@/lib/site/palette";
import { allowUser, tooMany } from "@/lib/rate";

const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX = 5 * 1024 * 1024;

// Recebe logo ou foto (base64), valida o arquivo de verdade, guarda na pasta do usuário e devolve a URL e as cores.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  if (!(await allowUser(supabase, "upload", 20, 60))) return tooMany();

  const body = await request.json().catch(() => null);
  const mediaType = String(body?.mediaType ?? "");
  const kind = body?.kind === "logo" ? "logo" : "foto";
  if (!TYPES[mediaType]) return NextResponse.json({ error: "Envie uma imagem PNG, JPG ou WebP." }, { status: 400 });
  const raw = String(body?.data ?? "");
  if (raw.length > Math.ceil((MAX * 4) / 3) + 8) return NextResponse.json({ error: "A imagem deve ter até 5 MB." }, { status: 400 });
  const buf = Buffer.from(raw, "base64");
  if (!buf.length || buf.length > MAX) return NextResponse.json({ error: "A imagem deve ter até 5 MB." }, { status: 400 });

  // valida o conteúdo real (não só o tipo declarado) e limita a resolução
  const meta = await sharp(buf).metadata().catch(() => null);
  if (!meta?.format || !["png", "jpeg", "webp"].includes(meta.format) || (meta.width ?? 0) > 8000 || (meta.height ?? 0) > 8000)
    return NextResponse.json({ error: "Arquivo de imagem inválido." }, { status: 400 });

  const theme = kind === "logo" ? await extractPalette(buf).catch(() => null) : null;
  const path = `${auth.user.id}/${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${TYPES[mediaType]}`;
  const up = await supabase.storage.from("uploads").upload(path, buf, { contentType: mediaType });
  if (up.error) return NextResponse.json({ error: "Não foi possível guardar a imagem." }, { status: 500 });
  return NextResponse.json({ url: supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl, theme });
}
