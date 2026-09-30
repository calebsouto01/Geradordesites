"use client";
import { useState } from "react";

export default function PlanActions({ hasSub }: { hasSub: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go(path: string) {
    setBusy(true); setErr("");
    const res = await fetch(path, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(json.error ?? "Não foi possível continuar.");
    window.location.href = json.url;
  }
  return (
    <div>
      <button disabled={busy} onClick={() => go(hasSub ? "/api/billing/portal" : "/api/billing/checkout")}>{busy ? "Aguarde…" : hasSub ? "Gerenciar assinatura" : "Assinar o Plano Inicial"}</button>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
