import type { Profile } from "./types";

type Review = { rating?: number; text?: { text: string }; authorAttribution?: { displayName?: string } };

// Uma chamada de detalhes, só quando o usuário gera o site. Fotos ficam de fora (regras do Google).
export async function fetchPlaceProfile(placeId: string, fallback: Profile): Promise<Profile> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return fallback;
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=pt-BR`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "displayName,formattedAddress,nationalPhoneNumber,rating,userRatingCount,primaryTypeDisplayName,editorialSummary,regularOpeningHours.weekdayDescriptions,reviews,googleMapsUri",
    },
  });
  if (!res.ok) return fallback;
  const d = await res.json();
  return {
    name: d.displayName?.text ?? fallback.name,
    category: d.primaryTypeDisplayName?.text ?? fallback.category,
    address: d.formattedAddress ?? fallback.address,
    phone: d.nationalPhoneNumber ?? fallback.phone,
    rating: d.rating ?? fallback.rating,
    ratingCount: d.userRatingCount ?? fallback.ratingCount,
    summary: d.editorialSummary?.text,
    hours: d.regularOpeningHours?.weekdayDescriptions ?? [],
    mapsUrl: d.googleMapsUri,
    reviews: ((d.reviews ?? []) as Review[]).map((r) => ({
      author: r.authorAttribution?.displayName ?? "Cliente",
      text: (r.text?.text ?? "").slice(0, 240),
      rating: r.rating ?? 0,
    })),
  };
}
