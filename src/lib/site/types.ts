export type LayoutKey = "classico" | "moderno" | "vitrine";

export type SectionKey = "numeros" | "sobre" | "servicos" | "diferenciais" | "comofunciona" | "planos" | "catalogo" | "promo" | "equipe" | "galeria" | "depoimentos" | "faq" | "cta" | "contato";
export type SectionCfg = { key: SectionKey; on: boolean };
export type PriceItem = { name: string; price: string; text: string };

export type Theme = { accent: string; accent2: string; onAccent: string; surface: string; text: string };

export type Photo = { name: string; width: number; height: number; author: string; url?: string };

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
  photos?: Photo[];
};

export type SiteContent = {
  business: { name: string; category: string; address: string; phone: string; whatsapp: string; rating: number | null; ratingCount: number | null; mapsUrl: string };
  theme: Partial<Theme> & { accent: string };
  tone?: string;
  logoUrl?: string;
  photos?: Photo[];
  faq?: { q: string; a: string }[];
  years?: number;
  differentials?: { title: string; text: string }[];
  steps?: { title: string; text: string }[];
  plans?: PriceItem[];
  catalog?: PriceItem[];
  team?: { name: string; role: string }[];
  promo?: { title: string; text: string };
  sections?: SectionCfg[];
  sources?: Record<string, string>;
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
