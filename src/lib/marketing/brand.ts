import { CONTACT_EMAIL } from "@/lib/legal";

// Dados de marca num só lugar. Valores entre colchetes são marcadores: aparecem destacados na página até serem preenchidos.
// Para aplicar a identidade definida pelo profissional de brand, edite este arquivo e as variáveis de cor em marketing.css.
export const BRAND = {
  product: "GD Sites", // nome de trabalho da plataforma
  company: process.env.NEXT_PUBLIC_AGENCY_NAME ?? "[NOME DA EMPRESA]",
  owner: process.env.NEXT_PUBLIC_AGENCY_OWNER ?? "[SEU NOME]",
  city: process.env.NEXT_PUBLIC_AGENCY_CITY ?? "[CIDADE]",
  address: process.env.NEXT_PUBLIC_AGENCY_ADDRESS ?? "[ENDEREÇO]",
  cnpj: process.env.NEXT_PUBLIC_AGENCY_CNPJ ?? "[CNPJ]",
  whatsapp: process.env.NEXT_PUBLIC_AGENCY_WHATSAPP ?? "", // só números com DDI, ex.: 5575999999999
  email: CONTACT_EMAIL,
  instagram: process.env.NEXT_PUBLIC_AGENCY_INSTAGRAM ?? "", // sem @
  plan: { price: "R$ 49,90", credits: 45, trial: 6, search: 3, site: 3, premium: 3, messages: 1 },
} as const;

export const isPlaceholder = (v: string) => v.startsWith("[");

// Link de contato do site da empresa: WhatsApp quando houver número; senão, e-mail.
export function contactHref(message: string) {
  return BRAND.whatsapp ? `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(message)}` : `mailto:${BRAND.email}?subject=${encodeURIComponent(message)}`;
}
