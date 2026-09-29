"use client";
import { useEffect, useState } from "react";
import SiteRender from "@/components/SiteRender";
import type { SiteContent } from "@/lib/site/types";

// Prévia do rascunho: lê o que o assistente de criação guardou no navegador (nada vai para o banco).
export default function Preview() {
  const [draft, setDraft] = useState<{ content: SiteContent; template: string } | null>(null);
  useEffect(() => {
    const read = () => { try { const raw = sessionStorage.getItem("draftSite"); setDraft(raw ? JSON.parse(raw) : null); } catch { setDraft(null); } };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("message", read);
    return () => { window.removeEventListener("storage", read); window.removeEventListener("message", read); };
  }, []);
  if (!draft) return <p style={{ padding: 30, color: "#667089" }}>A prévia aparece aqui conforme você preenche os dados.</p>;
  return <SiteRender c={draft.content} preview slug="rascunho" template={draft.template} photoUrl={(i) => draft.content.photos?.[i]?.url ?? ""} />;
}
