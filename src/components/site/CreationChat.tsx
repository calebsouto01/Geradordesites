"use client";
import { useEffect, useRef, useState } from "react";
import type { LayoutKey, Theme } from "@/lib/site/types";

type Msg = { role: "user" | "assistant"; text: string };
type Reply = {
  reply: string; layout?: LayoutKey; servicos?: { title: string; text: string }[]; horarios?: string[]; pronto_para_gerar?: boolean;
  theme?: Theme | null; imageUrl?: string; error?: string;
};

const LAYOUTS: { key: LayoutKey; label: string; hint: string }[] = [
  { key: "classico", label: "Clássico", hint: "Claro e sóbrio" },
  { key: "moderno", label: "Moderno", hint: "Escuro e ousado" },
  { key: "vitrine", label: "Vitrine", hint: "Cartões coloridos" },
];

const toBase64 = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(",")[1] ?? "");
  r.onerror = rej;
  r.readAsDataURL(f);
});

export default function CreationChat({ leadId, leadName, onClose, onDone }: { leadId: number; leadName: string; onClose: () => void; onDone: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [layout, setLayout] = useState<LayoutKey | undefined>();
  const [theme, setTheme] = useState<Theme | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [servicos, setServicos] = useState<{ title: string; text: string }[] | undefined>();
  const [horarios, setHorarios] = useState<string[] | undefined>();
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send(history: Msg[], file?: File) {
    setBusy(true); setErr("");
    const image = file ? { mediaType: file.type, data: await toBase64(file) } : undefined;
    const res = await fetch("/api/sites/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, messages: history, image }) });
    const json = (await res.json().catch(() => ({}))) as Reply;
    setBusy(false);
    if (!res.ok) return setErr(json.error ?? "Erro no assistente.");
    setMsgs([...history, { role: "assistant", text: json.reply }]);
    if (json.layout) setLayout((l) => l ?? json.layout);
    if (json.theme) setTheme(json.theme);
    if (json.imageUrl && file) {
      // Logo se o usuário disse que é logo; senão vira foto do site
      const isLogo = /logo|marca/i.test(history.filter((m) => m.role === "user").slice(-1)[0]?.text ?? "");
      if (isLogo) setLogoUrl(json.imageUrl); else setPhotos((p) => [...p, json.imageUrl!]);
    }
    if (json.servicos?.length) setServicos(json.servicos);
    if (json.horarios?.length) setHorarios(json.horarios);
    setReady(Boolean(json.pronto_para_gerar));
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    send([{ role: "user", text: "Vamos criar o site." }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, text: text.trim() }];
    setMsgs(next); setText("");
    send(next);
  }

  async function attach(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || busy) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) return setErr("Envie uma imagem PNG, JPG ou WebP.");
    if (f.size > 5 * 1024 * 1024) return setErr("A imagem deve ter até 5 MB.");
    const next = [...msgs, { role: "user" as const, text: `[imagem enviada: ${f.name}]` }];
    setMsgs(next);
    send(next, f);
  }

  async function generate() {
    setBusy(true); setErr("");
    const res = await fetch("/api/sites/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, layout, theme: theme ?? undefined, logoUrl, extraPhotos: photos, servicos, horarios }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(json.error ?? "Erro ao gerar o site.");
    onDone();
  }

  return (
    <div className="modal" role="dialog" aria-label="Assistente de criação">
      <div className="chat">
        <div className="chathead">
          <div><b>Criar site</b><div className="mut">{leadName}</div></div>
          <button className="iconbtn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="layouts">
          {LAYOUTS.map((l) => (
            <button key={l.key} className={`layopt ${layout === l.key ? "on" : ""}`} onClick={() => setLayout(l.key)}>
              <b>{l.label}</b><span>{l.hint}</span>
            </button>
          ))}
        </div>

        <div className="chatbody">
          {msgs.filter((m) => !m.text.startsWith("Vamos criar o site.")).map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>{m.text}</div>
          ))}
          {busy && <div className="bubble assistant mut">Pensando…</div>}
          {theme && <div className="swatches"><span style={{ background: theme.accent }} /><span style={{ background: theme.accent2 }} /><small className="mut">cores identificadas</small></div>}
          <div ref={end} />
        </div>
        {err && <p className="err" style={{ margin: "0 16px" }}>{err}</p>}

        <form className="chatform" onSubmit={submit}>
          <label className="attach" title="Enviar logo, foto ou print">
            📎<input type="file" accept="image/png,image/jpeg,image/webp" onChange={attach} hidden />
          </label>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva aqui (ou anexe o logo / um print)" />
          <button disabled={busy || !text.trim()}>Enviar</button>
        </form>
        <div className="chatfoot">
          <span className="mut">Dica: ao enviar o logo, escreva “logo” na mensagem anterior.</span>
          <button disabled={busy || (!ready && msgs.length < 3)} onClick={generate}>Gerar site · 3 créditos</button>
        </div>
      </div>
    </div>
  );
}
