"use client";
import { useState } from "react";

// Formulário do site: a mensagem chega ao dono do site (o vendedor) no painel.
export default function LeadForm({ slug }: { slug: string }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const demo = slug === "rascunho";

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (demo) return setState("ok");
    const f = new FormData(e.currentTarget);
    setState("busy");
    const res = await fetch("/api/site/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, name: f.get("name"), phone: f.get("phone"), message: f.get("message"), website: f.get("website") }) });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return setState("ok");
    setMsg(json.error ?? "Não foi possível enviar agora."); setState("err");
  }

  if (state === "ok") return <div className="sx-form ok"><b>Mensagem enviada!</b><p>{demo ? "Na versão publicada, a mensagem chega para o negócio." : "Em breve entraremos em contato."}</p></div>;
  return (
    <form className="sx-form" onSubmit={send}>
      <label>Seu nome<input name="name" required minLength={2} maxLength={80} autoComplete="name" /></label>
      <label>Telefone ou WhatsApp<input name="phone" inputMode="tel" maxLength={30} autoComplete="tel" /></label>
      <label>Mensagem<textarea name="message" rows={4} maxLength={600} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden style={{ position: "absolute", left: "-9999px", height: 0, opacity: 0 }} />
      <button disabled={state === "busy"}>{state === "busy" ? "Enviando…" : "Enviar mensagem"}</button>
      {state === "err" && <p className="sx-err">{msg}</p>}
    </form>
  );
}
