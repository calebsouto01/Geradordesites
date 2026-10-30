import type { Photo, Profile } from "./types";
import { extractPalette } from "./palette";

type Review = { rating?: number; text?: { text: string }; authorAttribution?: { displayName?: string } };

// Uma chamada de detalhes, só quando o usuário gera o site. Fotos ficam de fora (regras do Google).
export async function fetchPlaceProfile(placeId: string, fallback: Profile): Promise<Profile> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return fallback;
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=pt-BR`, {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "displayName,formattedAddress,nationalPhoneNumber,rating,userRatingCount,primaryTypeDisplayName,editorialSummary,regularOpeningHours.weekdayDescriptions,reviews,googleMapsUri,photos",
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
    photos: rankPhotos(((d.photos ?? []) as { name: string; widthPx: number; heightPx: number; authorAttributions?: { displayName?: string }[] }[])
      .map((p) => ({ name: p.name, width: p.widthPx, height: p.heightPx, author: p.authorAttributions?.[0]?.displayName ?? "Google Maps" }))),
    reviews: ((d.reviews ?? []) as Review[]).map((r) => ({
      author: r.authorAttribution?.displayName ?? "Cliente",
      text: (r.text?.text ?? "").slice(0, 240),
      rating: r.rating ?? 0,
    })),
  };
}

// A capa precisa de foto grande e horizontal; as demais vêm em seguida, as melhores primeiro. Fotos pequenas ficam de fora.
export function rankPhotos(all: Photo[]): Photo[] {
  const score = (p: Photo) => {
    const ratio = p.width && p.height ? p.width / p.height : 1;
    const landscape = ratio >= 1.25 && ratio <= 2.2 ? 1 : ratio >= 1 ? 0.5 : 0;
    return landscape * 2 + Math.min(p.width, 2400) / 1200;
  };
  const usable = all.filter((p) => !p.width || p.width >= 600);
  const ranked = [...(usable.length ? usable : all)].sort((a, b) => score(b) - score(a));
  return ranked.slice(0, 8);
}

// Só as cores da marca: a foto é lida na hora e não é guardada.
export async function paletteFromPlacePhoto(name: string) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !/^places\/[\w-]+\/photos\/[\w-]+$/.test(name)) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/${name}/media?maxWidthPx=480`, { headers: { "X-Goog-Api-Key": key }, redirect: "follow" });
    if (!res.ok) return null;
    return await extractPalette(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
}
