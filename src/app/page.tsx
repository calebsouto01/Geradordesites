"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Result = {
  id: number; place_id: string; name: string; address: string | null;
  phone: string | null; rating: number | null; rating_count: number | null;
};

export default function Buscar() {
  const supabase = createClient();
  const [results, setResults] = useState<Result[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [form, setForm] = useState({ location: "", category: "", minRating: "4.5" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [{ data }, { data: rem }] = await Promise.all([
      supabase.from("search_results").select("*").eq("status", "novo").order("rating", { ascending: false }),
      supabase.rpc("quota_remaining"),
    ]);
    setResults((data as Result[]) ?? []);
    setRemaining(rem as number | null);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, minRating: Number(form.minRating) }),
    });
    const json = await res.json();
    if (!res.ok) setMsg(json.error ?? "Erro na busca.");
    else setMsg(json.found ? "" : "Nenhum negócio novo sem site encontrado.");
    await load();
    setBusy(false);
  }

  async function promote(r: Result) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("leads").insert({
      user_id: u.user!.id, place_id: r.place_id, name: r.name, phone: r.phone, address: r.address,
    });
    if (error && error.code !== "23505") return setMsg(error.message);
    await supabase.from("search_results").update({ status: "promovido" }).eq("id", r.id);
    setResults((l) => l.filter((x) => x.id !== r.id));
  }

  async function discard(r: Result) {
    await supabase.from("search_results").update({ status: "descartado" }).eq("id", r.id);
    setResults((l) => l.filter((x) => x.id !== r.id));
  }

  return (
    <>
      <form onSubmit={search} className="row">
        <input placeholder="Localização (ex: Fortaleza, CE)" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        <input placeholder="Categoria (ex: salão de beleza)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <select value={form.minRating} onChange={(e) => setForm({ ...form, minRating: e.target.value })}>
          {["3.5", "4.0", "4.5", "4.8"].map((n) => <option key={n} value={n}>Nota ≥ {n}</option>)}
        </select>
        <button disabled={busy || remaining === 0}>{busy ? "Buscando…" : "Buscar"}</button>
        {remaining !== null && <span className="mut">{remaining} buscas restantes este mês</span>}
      </form>
      {msg && <p className="err">{msg}</p>}
      <div className="grid">
        {results.map((r) => (
          <div key={r.id} className="card">
            <strong>{r.name}</strong>
            <div className="mut">{r.address}</div>
            <div className="mut">{r.phone ?? "Sem telefone"}</div>
            <div>★ {r.rating} <span className="mut">({r.rating_count} avaliações)</span></div>
            <div className="row" style={{ marginTop: 10 }}>
              <button onClick={() => promote(r)}>Promover pro funil</button>
              <button className="ghost" onClick={() => discard(r)}>Descartar</button>
            </div>
          </div>
        ))}
      </div>
      {!results.length && <p className="mut">Faça uma busca para listar negócios bem avaliados sem site.</p>}
    </>
  );
}
