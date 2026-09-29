"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };
export type Step = "modelo" | "cliente" | "dados" | "revisao";

export type DraftSummary = {
  layout?: string; nome?: string; categoria?: string; telefone: boolean; endereco: boolean;
  horarios: number; servicos: number; logo: boolean; fotos: number; cores: boolean;
};

const GUIDE: Record<Step, (d: DraftSummary) => string> = {
  modelo: () => "Oi! Vou te guiar. Primeiro escolha o modelo do site: Moderno combina com academias e barbearias, Clássico com clínicas e serviços, Vitrine com restaurantes e salões.",
  cliente: (d) => d.nome ? `Você escolheu o modelo ${d.layout}. Agora selecione o cliente da lista ou cadastre um novo manualmente. O telefone vira o botão de WhatsApp.` : "Agora o cliente: escolha um da sua lista ou cadastre manualmente. O telefone vira o botão de WhatsApp.",
  dados: (d) => {
    const falta = [!d.logo && "o logo (define as cores da marca)", !d.horarios && "os horários", !d.servicos && "os serviços", !d.telefone && "o telefone"].filter(Boolean);
    return falta.length ? `Revise os dados de ${d.nome ?? "seu cliente"}. Ainda falta: ${falta.join(", ")}. Se não tiver o logo, envie uma foto da fachada ou um print do Instagram.` : `Dados completos de ${d.nome ?? "seu cliente"}. Revise os textos e siga para a revisão.`;
  },
  revisao: (d) => `Confira a prévia. Modelo ${d.layout}, ${d.fotos} foto(s) enviada(s), ${d.servicos} serviço(s). Estando bom, gere o site: são 3 créditos.`,
};

export default function AssistantPanel({ step, draft, open, onToggle }: { step: Step; draft: DraftSummary; open: boolean; onToggle: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const last = useRef<Step | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Cada etapa começa com uma orientação do assistente.
  useEffect(() => {
    if (last.current === step) return;
    last.current = step;
    setMsgs((m) => [...m, { role: "assistant", text: GUIDE[step](draftRef.current) }]);
  }, [step]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: "user" as const, text: t }];
    setMsgs(next); setText(""); setBusy(true);
    const res = await fetch("/api/sites/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, step, draft }) });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setMsgs([...next, { role: "assistant", text: json.reply ?? "Não consegui responder agora. Siga com as etapas ao lado." }]);
  }

  return (
    <>
      <button className="assist-fab" onClick={onToggle} aria-label="Abrir assistente">💬 Assistente</button>
      <aside className={`assist ${open ? "open" : ""}`}>
        <div className="assist-head"><b>💬 Assistente</b><button className="iconbtn assist-x" onClick={onToggle} aria-label="Fechar">✕</button></div>
        <div className="chatbody">
          {msgs.map((m, i) => <div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}
          {busy && <div className="bubble assistant mut">Pensando…</div>}
          <div ref={end} />
        </div>
        <form className="chatform" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Pergunte algo ao assistente" />
          <button disabled={busy || !text.trim()}>Enviar</button>
        </form>
      </aside>
    </>
  );
}
