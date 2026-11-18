import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allowUser } from "@/lib/rate";

// Foto de um resultado de busca do próprio usuário (a chave do Google não vai para o navegador; o arquivo não é guardado).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const i = Number(url.searchParams.get("i"));
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!Number.isInteger(id) || !Number.isInteger(i) || i < 0 || i > 2 || !key) return new NextResponse(null, { status: 404 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse(null, { status: 401 });
  if (!(await allowUser(supabase, "sphoto", 300, 60))) return new NextResponse(null, { status: 429 });
  const { data } = await supabase.from("search_results").select("photos").eq("id", id).maybeSingle();
  const name = (data?.photos as string[] | null)?.[i];
  if (!name || !/^places\/[\w-]+\/photos\/[\w-]+$/.test(name)) return new NextResponse(null, { status: 404 });
  const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=480`, { headers: { "X-Goog-Api-Key": key }, redirect: "follow" });
  if (!res.ok) return new NextResponse(null, { status: 404 });
  return new NextResponse(await res.arrayBuffer(), {
    headers: { "Content-Type": res.headers.get("content-type") ?? "image/jpeg", "Cache-Control": "private, max-age=3600" },
  });
}
