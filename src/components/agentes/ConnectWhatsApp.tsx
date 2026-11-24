"use client";
import { useEffect, useRef, useState } from "react";

const APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID;

type FB = { init: (o: object) => void; login: (cb: (r: { authResponse?: { code?: string } }) => void, o: object) => void };
declare global { interface Window { FB?: FB; fbAsyncInit?: () => void } }

// Cadastro Incorporado da Meta: o cliente conecta o número em uma janela da Meta, sem copiar IDs ou tokens.
export default function ConnectWhatsApp({ agenteId, resposta, onDone }: { agenteId: number; resposta: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const session = useRef<{ phone_number_id?: string; waba_id?: string }>({});

  useEffect(() => {
    if (!APP_ID) return;
    window.fbAsyncInit = () => window.FB?.init({ appId: APP_ID, autoLogAppEvents: true, xfbml: false, version: "v21.0" });
    if (!document.getElementById("fb-sdk")) {
      const s = document.createElement("script");
      s.id = "fb-sdk"; s.async = true; s.src = "https://connect.facebook.net/pt_BR/sdk.js";
      document.body.appendChild(s);
    } else window.fbAsyncInit();
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.facebook.com" && e.origin !== "https://web.facebook.com") return;
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d?.type === "WA_EMBEDDED_SIGNUP" && d.event === "FINISH") session.current = { phone_number_id: d.data?.phone_number_id, waba_id: d.data?.waba_id };
      } catch { /* mensagem de outra origem */ }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!APP_ID || !CONFIG_ID) return null;

  function start() {
    if (!window.FB) { setMsg("O Facebook ainda está carregando. Tente de novo em instantes."); return; }
    setMsg(""); setBusy(true); session.current = {};
    window.FB.login(async (r) => {
      const code = r.authResponse?.code;
      if (!code) { setBusy(false); setMsg("Conexão cancelada."); return; }
      // O evento FINISH chega logo depois do login; espera um instante.
      await new Promise((ok) => setTimeout(ok, 1500));
      const res = await fetch("/api/agentes/whatsapp/connect", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agente_id: agenteId, code, resposta_padrao: resposta, ...session.current }) });
      const out = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok) { setMsg(out.error ?? "Não foi possível conectar."); return; }
      setMsg("WhatsApp conectado."); onDone();
    }, { config_id: CONFIG_ID, response_type: "code", override_default_response_type: true, extras: { setup: {}, sessionInfoVersion: "3" } });
  }

  return (
    <div>
      <button onClick={start} disabled={busy}>{busy ? "Conectando…" : "Conectar WhatsApp"}</button>
      <p className="mut">Uma janela da Meta abre para você escolher ou cadastrar o número. Não precisa copiar nenhum código.</p>
      {msg && <p className={msg.startsWith("WhatsApp") ? "mut" : "err"}>{msg}</p>}
    </div>
  );
}
