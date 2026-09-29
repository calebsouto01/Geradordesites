import type { LayoutKey, SiteContent } from "@/lib/site/types";
import { themeFromAccent } from "@/lib/site/palette-client";
import { suggestLayout } from "@/lib/site/generate";
import Classico from "./site/layouts/Classico";
import Moderno from "./site/layouts/Moderno";
import Vitrine from "./site/layouts/Vitrine";
import SiteEffects from "./SiteEffects";

const LAYOUTS: Record<LayoutKey, typeof Classico> = { classico: Classico, moderno: Moderno, vitrine: Vitrine };

export function layoutOf(template: string, c: SiteContent): LayoutKey {
  return template in LAYOUTS ? (template as LayoutKey) : suggestLayout(c.business.category);
}

export default function SiteRender({ c, preview, expiresAt, slug, template, photoUrl }: {
  c: SiteContent; preview: boolean; expiresAt?: string | null; slug: string; template: string; photoUrl?: (i: number) => string;
}) {
  const t = { ...themeFromAccent(c.theme.accent), ...c.theme };
  const key = layoutOf(template, c);
  const Layout = LAYOUTS[key];
  const photo = photoUrl ?? ((i: number) => c.photos?.[i]?.url ?? `/api/photo?slug=${encodeURIComponent(slug)}&i=${i}`);
  return (
    <div className="st" style={{ ["--accent" as string]: t.accent, ["--accent2" as string]: t.accent2, ["--on" as string]: t.onAccent, ["--surface" as string]: t.surface, ["--text" as string]: t.text }}>
      {preview && (
        <div className="st-banner">
          Prévia gratuita — este site ainda não foi publicado{expiresAt ? ` · disponível até ${new Date(expiresAt).toLocaleDateString("pt-BR")}` : ""}
        </div>
      )}
      {preview && <div className="st-mark" aria-hidden>PRÉVIA</div>}
      <Layout c={c} photo={photo} />
      {c.business.whatsapp && <a className="st-float" href={`https://wa.me/${c.business.whatsapp}`} aria-label="WhatsApp">WhatsApp</a>}
      <SiteEffects layout={key} />
    </div>
  );
}
