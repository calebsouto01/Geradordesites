"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Criar o site em um clique: a IA decide modelo, cores, fotos e texto. O assistente completo vira "Personalizar".
export default function CreateSiteDialog({ lead, onClose }: { lead: { id: number; name: string }; onClose: () => void }) {
  const router = useRouter();
  const [premium, setPremium] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<{ id: number; premiumSkipped: boolean } | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    createClient().rpc("credits_remaining").then(({ data }) => setCredits(typeof data === "number" ? data : null));
  }, []);

  const cost = premium ? 6 : 3;
  const short = credits !== null && credits < cost;

  async function create() {
    setErr(""); setBusy(true);
    const res = await fetch("/api/sites/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: lead.id, premium }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); return setErr(json.error ?? "Não foi possível criar o site."); }
    if (premium && !json.premium) { setBusy(false); return setDone({ id: json.site.id, premiumSkipped: true }); }
    router.push(`/sites/${json.site.id}`);
  }

  return (
    <div className="modal" onClick={busy ? undefined : onClose}>
      <div className="chat" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Criar site">
        <div className="chathead"><b>Criar site: {lead.name}</b>{!busy && <button className="iconbtn" onClick={onClose} aria-label="Fechar">✕</button>}</div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {busy ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <b>{lead.name}</b>
              <div className="track" style={{ margin: "14px 0" }}><div style={{ width: "60%", background: "var(--acc)", animation: "pulse 1.4s ease-in-out infinite" }} /></div>
              <p className="mut" style={{ margin: 0 }}>Lendo os dados e as fotos do negócio… Não feche esta janela. O site abre sozinho quando ficar pronto.</p>
            </div>
          ) : done ? (
            <>
              <p style={{ margin: 0 }}>O site foi criado com o texto padrão. O texto premium não ficou disponível agora, então <b>não cobramos os 3 créditos extras</b>.</p>
              <button onClick={() => router.push(`/sites/${done.id}`)}>Abrir o site</button>
            </>
          ) : (
            <>
              <div className="panel" style={{ background: "var(--bg2)" }}>
                <b>Como o site vai sair</b>
                <p className="mut" style={{ margin: "6px 0 0" }}>O modelo é escolhido pelo ramo do negócio, com as cores, a nota e as avaliações do Google, os depoimentos reais e as fotos do negócio quando existirem. Em poucos segundos você tem uma prévia para enviar ao cliente.</p>
              </div>
              <label className="optrow">
                <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
                <span><b>Texto premium (+3 créditos)</b><small>Usa o modelo de IA mais avançado: textos mais longos e naturais, diferenciais e perguntas frequentes feitos para o ramo do negócio.</small></span>
              </label>
              {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
              {short && <p className="err" style={{ margin: 0 }}>Você tem {credits} crédito(s); esta opção custa {cost}.</p>}
              <button disabled={short} onClick={create}>Criar prévia · {cost} créditos</button>
              <Link href={`/sites/novo?lead=${lead.id}`} className="mut" style={{ textAlign: "center" }}>Personalizar antes (escolher modelo, seções e dados)</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
