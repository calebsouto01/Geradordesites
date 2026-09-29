import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Place = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const location = String(body?.location ?? "").trim();
  const category = String(body?.category ?? "").trim();
  const minRating = Number(body?.minRating);
  if (!location || !category || !(minRating >= 0 && minRating <= 5) || location.length > 120 || category.length > 120) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  // Cota mensal checada no servidor (função SQL) antes de gastar a API do Google.
  const { data: remaining, error: quotaError } = await supabase.rpc("consume_search", {
    p_location: location,
    p_category: category,
    p_min_rating: minRating,
  });
  if (quotaError) {
    const exceeded = quotaError.message.includes("quota_exceeded");
    return NextResponse.json(
      { error: exceeded ? "Cota mensal de buscas esgotada." : "Erro ao validar a cota." },
      { status: exceeded ? 429 : 500 },
    );
  }

  // Uma única chamada: já pede o websiteUri, sem Place Details por resultado.
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.websiteUri",
    },
    body: JSON.stringify({
      textQuery: `${category} em ${location}`,
      languageCode: "pt-BR",
      regionCode: "BR",
      minRating,
      pageSize: 20,
    }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Falha ao consultar o Google.", remaining }, { status: 502 });
  }
  const { places = [] } = (await res.json()) as { places?: Place[] };

  const rows = places
    .filter((p) => !p.websiteUri && (p.rating ?? 0) >= minRating)
    .map((p) => ({
      user_id: auth.user.id,
      place_id: p.id,
      name: p.displayName?.text ?? "Sem nome",
      address: p.formattedAddress ?? null,
      phone: p.nationalPhoneNumber ?? null,
      rating: p.rating ?? null,
      rating_count: p.userRatingCount ?? null,
    }));

  // Já vistos (promovidos/descartados/em lista) não duplicam.
  if (rows.length) {
    await supabase.from("search_results").upsert(rows, { onConflict: "user_id,place_id", ignoreDuplicates: true });
  }
  return NextResponse.json({ remaining, found: rows.length });
}
