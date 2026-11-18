import { ImageResponse } from "next/og";
import { createAnonClient } from "@/lib/supabase/anon";
import type { SiteRow } from "@/lib/site/types";

export const alt = "Site do negócio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Card de compartilhamento (WhatsApp, redes): nome, categoria, nota e a cor da marca.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await createAnonClient().rpc("get_site", { p_slug: slug });
  const c = (data as SiteRow | null)?.content;
  const accent = c?.theme?.accent ?? "#6366f1";
  const name = c?.business.name ?? "Site";
  const stars = c?.business.rating ? Math.round(c.business.rating) : 0;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, color: "#fff", background: `linear-gradient(135deg, ${accent}, #0b0d13)` }}>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>{c?.business.category || "Negócio local"}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: name.length > 34 ? 64 : 84, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
          <div style={{ display: "flex", fontSize: 34, marginTop: 24, opacity: 0.9 }}>{c?.hero.subheadline.slice(0, 110)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 32 }}>
          <div style={{ display: "flex", marginRight: 16 }}>
            {Array.from({ length: stars }).map((_, i) => (
              <svg key={i} width="38" height="38" viewBox="0 0 24 24" style={{ marginRight: 4 }}><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="#fde047" /></svg>
            ))}
          </div>
          <div style={{ display: "flex" }}>{c?.business.rating ? `${c.business.rating} no Google` : ""}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
