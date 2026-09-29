export type Profile = {
  name: string;
  category?: string;
  address?: string;
  phone?: string;
  rating?: number;
  ratingCount?: number;
  hours?: string[];
  summary?: string;
  reviews?: { author: string; text: string; rating: number }[];
  mapsUrl?: string;
};

export type SiteContent = {
  business: { name: string; category: string; address: string; phone: string; whatsapp: string; rating: number | null; ratingCount: number | null; mapsUrl: string };
  theme: { accent: string };
  hero: { headline: string; subheadline: string; cta: string };
  about: { title: string; text: string };
  services: { title: string; items: { title: string; text: string }[] };
  reviews: { title: string; items: { author: string; text: string; rating: number }[] };
  hours: string[];
};

export type SiteRow = {
  id: number; lead_id: number; slug: string; status: "previa" | "publicado"; template: string;
  content: SiteContent; expires_at: string | null; views: number;
  first_viewed_at: string | null; last_viewed_at: string | null;
};
