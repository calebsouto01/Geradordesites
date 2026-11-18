"use client";
import { useEffect, useState } from "react";

export default function Denuncia() {
  const [slug, setSlug] = useState("");
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  useEffect(() => { setSlug(new URLSearchParams(window.location.search).get("slug") ?? ""); }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/site/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, reason, contact }) });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return setState("ok");
    setMsg(json.error ?? "Não foi possível enviar."); setState("err");
  }

  return (
    <main className="legal">
      <h1>Denunciar um site</h1>
      {state === "ok" ? <p>Recebemos sua denúncia. Vamos analisar e, se houver violação, o site será bloqueado. Obrigado.</p> : (
        <form onSubmit={send} className="rep">
          <label>Endereço ou nome do site<input value={slug} onChange={(e) => setSlug(e.target.value)} required maxLength={80} /></label>
          <label>O que está errado?<textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={5} maxLength={1000} rows={5} placeholder="Ex.: uso meu nome e dados sem autorização" /></label>
          <label>Seu contato (opcional)<input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} placeholder="E-mail ou telefone" /></label>
          <button disabled={state === "busy"}>{state === "busy" ? "Enviando…" : "Enviar denúncia"}</button>
          {state === "err" && <p style={{ color: "#c0392b" }}>{msg}</p>}
        </form>
      )}
    </main>
  );
}
