"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };
export type Step = "cliente" | "modelo" | "secoes" | "dados" | "revisao";

export type DraftSummary = {
  secoes?: number; layout?: string; nome?: string; categoria?: string; telefone: boolean; endereco: boolean;
  horarios: number; servicos: number; logo: boolean; fotos: number; cores: boolean;
};

const GUIDE: Record<Step, (d: DraftSummary) => string> = {
  cliente: () => "Oi! Vou te guiar em 5 passos. Primeiro o cliente: escolha um da sua lista ou cadastre manualmente. O telefone vira o botão de WhatsApp do site.",
  modelo: (d) => `Agora o modelo do site para ${d.nome ?? "seu cliente"}. Já sugeri um pela categoria. Moderno combina com academias e barbearias, Clássico com clínicas e serviços, Vitrine com restaurantes e salões.`,
  secoes: (d) => `O modelo ${d.layout} já traz as seções padrão (fixas). Se quiser, marque outras, como planos, cardápio, equipe ou promoção. No próximo passo você preenche só o que escolher.`,
  dados: (d) => {
    const falta = [!d.logo && "o logo (define as cores da marca)", !d.horarios && "os horários", !d.servicos && "os serviços", !d.telefone && "o telefone"].filter(Boolean);
    return falta.length ? `Preencha os dados de ${d.nome ?? "seu cliente"}. Ainda falta: ${falta.join(", ")}. Onde a seção aceita foto, há um campo de imagem. No fim, você pode pedir uma copy personalizada à IA.` : `Dados de ${d.nome ?? "seu cliente"} completos. Se quiser um texto sob medida, ligue a chave de copy personalizada e escreva um briefing.`;
  },
  revisao: (d) => `Hora da conferência: ${d.secoes ?? 0} seções ativas, ${d.fotos} foto(s), modelo ${d.layout}. Veja os avisos na lista; estando bom, gere o site (3 créditos).`,
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
