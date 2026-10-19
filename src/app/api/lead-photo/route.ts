import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allowUser } from "@/lib/rate";

const NAME = /^places\/[\w-]+\/photos\/[\w-]+$/;

// Foto de um contato do próprio usuário. As referências ficam guardadas no lead (uma consulta ao Google por lead);
// a imagem é buscada na hora de exibir, sem expor a chave e sem guardar o arquivo.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const i = Math.max(0, Math.min(2, Number(url.searchParams.get("i") ?? 0) || 0));
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!Number.isInteger(id) || !key) return new NextResponse(null, { status: 404 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse(null, { status: 401 });
  if (!(await allowUser(supabase, "leadphoto", 300, 60))) return new NextResponse(null, { status: 429 });

  const { data: lead } = await supabase.from("leads").select("place_id, photos").eq("id", id).maybeSingle();
  if (!lead) return new NextResponse(null, { status: 404 });
  let names = (lead.photos as string[] | null) ?? null;

  if (names === null) {
    names = [];
    if (lead.place_id && /^[\w-]+$/.test(lead.place_id)) {
      const res = await fetch(`https://places.googleapis.com/v1/places/${lead.place_id}`, { headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "photos" } });
      if (res.ok) {
        const d = (await res.json()) as { photos?: { name: string }[] };
        names = (d.photos ?? []).map((p) => p.name).filter((n) => NAME.test(n)).slice(0, 3);
        await supabase.from("leads").update({ photos: names }).eq("id", id);
      }
    }
  }
  const name = names[i];
  if (!name || !NAME.test(name)) return new NextResponse(null, { status: 404 });
  const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=480`, { headers: { "X-Goog-Api-Key": key }, redirect: "follow" });
  if (!res.ok) return new NextResponse(null, { status: 404 });
  return new NextResponse(await res.arrayBuffer(), {
    headers: { "Content-Type": res.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "private, max-age=3600" },
  });
}
