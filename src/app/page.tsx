"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Stars from "@/components/Stars";

type Result = {
  id: number; place_id: string; name: string; address: string | null;
  phone: string | null; rating: number | null; rating_count: number | null;
};

export default function Buscar() {
  const supabase = createClient();
  const router = useRouter();
  const [results, setResults] = useState<Result[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [form, setForm] = useState({ location: "", category: "", minRating: "4.5" });
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };

  const load = useCallback(async () => {
    const [{ data }, { data: rem }] = await Promise.all([
      supabase.from("search_results").select("*").eq("status", "novo").order("rating", { ascending: false }),
      supabase.rpc("quota_remaining"),
    ]);
    setResults((data as Result[]) ?? []);
    setRemaining(rem as number | null);
    setLoaded(true);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, minRating: Number(form.minRating) }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) setErr(json.error ?? "Erro na busca.");
    else flash(json.found ? `${json.found} negócios sem site encontrados` : "Nenhum negócio novo sem site nesta busca");
    await load();
    router.refresh();
    setBusy(false);
  }

  async function promote(r: Result) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("leads").insert({
      user_id: u.user!.id, place_id: r.place_id, name: r.name, phone: r.phone, address: r.address,
    });
    if (error && error.code !== "23505") return setErr(error.message);
    await supabase.from("search_results").update({ status: "promovido" }).eq("id", r.id);
    setResults((l) => l.filter((x) => x.id !== r.id));
    flash("Enviado para o funil");
  }

  async function discard(r: Result) {
    await supabase.from("search_results").update({ status: "descartado" }).eq("id", r.id);
    setResults((l) => l.filter((x) => x.id !== r.id));
  }

  return (
    <>
      <div className="pagehead">
        <h1>Buscar prospects</h1>
        <span className="mut">Negócios bem avaliados no Google que ainda não têm site.</span>
      </div>

      <form onSubmit={search} className="panel searchbar">
        <label className="f">Localização
          <input placeholder="Fortaleza, CE" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        </label>
        <label className="f">Categoria
          <input placeholder="Salão de beleza" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        </label>
        <label className="f">Nota mínima
          <select value={form.minRating} onChange={(e) => setForm({ ...form, minRating: e.target.value })}>
            {["3.5", "4.0", "4.5", "4.8"].map((n) => <option key={n} value={n}>★ {n}+</option>)}
          </select>
        </label>
        <button disabled={busy || remaining === 0}>{busy ? "Buscando…" : "Buscar"}</button>
      </form>
      {err && <p className="err">{err}</p>}

      <div className="grid">
        {busy && [0, 1, 2].map((i) => <div key={i} className="skel" />)}
        {results.map((r) => (
          <article key={r.id} className="rcard">
            <span className="badge">Sem site</span>
            <h3>{r.name}</h3>
            <div className="rating">
              <Stars value={r.rating} />
              <b>{r.rating}</b><span className="mut">({r.rating_count} avaliações)</span>
            </div>
            <div className="line">📍 {r.address ?? "Endereço não informado"}</div>
            <div className="line">📞 {r.phone ?? "Sem telefone"}</div>
            <div className="actions">
              <button onClick={() => promote(r)}>Promover pro funil</button>
              <button className="ghost" onClick={() => discard(r)}>Descartar</button>
            </div>
          </article>
        ))}
      </div>

      {loaded && !busy && !results.length && (
        <div className="empty">
          <div className="big">🔎</div>
          <b>Nenhum resultado por enquanto</b>
          <p>Escolha uma cidade e uma categoria para listar negócios sem site.</p>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
