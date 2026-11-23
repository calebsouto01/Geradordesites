"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TONS, type Agente } from "@/lib/agentes/prompt";

type Draft = { id?: number; nome: string; empresa: string; tom: string; instrucoes: string; conhecimento: string };
type Msg = { role: "user" | "assistant"; text: string };
const blank: Draft = { nome: "", empresa: "", tom: "amigavel", instrucoes: "", conhecimento: "" };

export default function Agentes() {
  const supabase = createClient();
  const [list, setList] = useState<Agente[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState<Agente | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("agentes").select("id, nome, empresa, tom, instrucoes, conhecimento, ativo").order("created_at", { ascending: false });
    if (error) setErr("Não foi possível carregar os agentes.");
    setList((data as Agente[]) ?? []);
    setLoaded(true);
  }, [supabase]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);

  async function save() {
    if (!draft || !draft.nome.trim()) { setErr("Dê um nome ao agente."); return; }
    setSaving(true); setErr("");
    const row = { nome: draft.nome.trim(), empresa: draft.empresa.trim() || null, tom: draft.tom, instrucoes: draft.instrucoes.trim() || null, conhecimento: draft.conhecimento.trim() || null };
    const { error } = draft.id ? await supabase.from("agentes").update(row).eq("id", draft.id) : await supabase.from("agentes").insert(row);
    setSaving(false);
    if (error) { setErr("Não foi possível salvar."); return; }
    setDraft(null); load();
  }

  async function remove(a: Agente) {
    if (!confirm(`Excluir o agente "${a.nome}"?`)) return;
    await supabase.from("agentes").delete().eq("id", a.id);
    if (test?.id === a.id) setTest(null);
    load();
  }

  async function send() {
    if (!test || !text.trim() || busy) return;
    const next: Msg[] = [...msgs, { role: "user", text: text.trim() }];
    setMsgs(next); setText(""); setBusy(true);
    const res = await fetch("/api/agentes/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agente_id: test.id, messages: next }) });
    const out = await res.json().catch(() => ({}));
    setMsgs([...next, { role: "assistant", text: out.reply ?? out.error ?? "Sem resposta." }]);
    setBusy(false);
  }

  return (
    <>
      <div className="pagehead">
        <h1>Agentes de IA</h1>
        <span className="mut">Crie atendentes virtuais para WhatsApp: defina o tom, as regras e a base de conhecimento do negócio e teste a conversa antes de ativar.</span>
      </div>
      {err && <p className="err">{err}</p>}
      <div className="twocol">
        <section className="panel">
          <div className="actions"><button onClick={() => { setDraft({ ...blank }); setErr(""); }}>+ Novo agente</button></div>
          {!loaded && <p className="mut">Carregando…</p>}
          {loaded && !list.length && <p className="empty">Nenhum agente ainda. Crie o primeiro.</p>}
          {list.map((a) => (
            <div key={a.id} className="citem">
              <b>{a.nome}</b>
              <span className="mut">{a.empresa ?? "Sem empresa"} · {TONS[a.tom]}</span>
              <div className="actions">
                <button className="sm" onClick={() => { setTest(a); setMsgs([]); }}>Testar</button>
                <button className="ghost sm" onClick={() => setDraft({ id: a.id, nome: a.nome, empresa: a.empresa ?? "", tom: a.tom, instrucoes: a.instrucoes ?? "", conhecimento: a.conhecimento ?? "" })}>Editar</button>
                <button className="iconbtn" onClick={() => remove(a)} aria-label="Excluir" title="Excluir">🗑</button>
              </div>
            </div>
          ))}
        </section>

        <section className="panel">
          {draft ? (
            <div className="formwrap">
              <h2>{draft.id ? "Editar agente" : "Novo agente"}</h2>
              <label>Nome do agente<input value={draft.nome} maxLength={80} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Ex.: Júlia" /></label>
              <label>Empresa<input value={draft.empresa} maxLength={120} onChange={(e) => setDraft({ ...draft, empresa: e.target.value })} placeholder="Ex.: Clínica Sorriso" /></label>
              <label>Tom de voz
                <select value={draft.tom} onChange={(e) => setDraft({ ...draft, tom: e.target.value })}>
                  {Object.entries(TONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label>Instruções<textarea rows={4} maxLength={4000} value={draft.instrucoes} onChange={(e) => setDraft({ ...draft, instrucoes: e.target.value })} placeholder="O que o agente deve fazer: agendar, tirar dúvidas, quando chamar um humano…" /></label>
              <label>Base de conhecimento<textarea rows={8} maxLength={20000} value={draft.conhecimento} onChange={(e) => setDraft({ ...draft, conhecimento: e.target.value })} placeholder="Serviços, preços, horários, endereço, perguntas frequentes…" /></label>
              <div className="actions">
                <button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</button>
                <button className="ghost" onClick={() => setDraft(null)}>Cancelar</button>
              </div>
            </div>
          ) : test ? (
            <div className="chat">
              <div className="chathead"><b>Testando: {test.nome}</b><button className="ghost sm" onClick={() => setMsgs([])}>Limpar</button></div>
              <div className="chatbody">
                {!msgs.length && <p className="mut">Escreva como se fosse um cliente no WhatsApp.</p>}
                {msgs.map((m, i) => <div key={i} className={`bubble ${m.role === "user" ? "me" : ""}`}>{m.text}</div>)}
                {busy && <div className="bubble mut">digitando…</div>}
                <div ref={end} />
              </div>
              <form className="chatform" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem do cliente…" maxLength={500} />
                <button disabled={busy || !text.trim()}>Enviar</button>
              </form>
            </div>
          ) : (
            <p className="empty">Selecione “Testar” em um agente ou crie um novo.</p>
          )}
        </section>
      </div>
    </>
  );
}
