"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TONS, type Agente } from "@/lib/agentes/prompt";
import ConnectWhatsApp from "@/components/agentes/ConnectWhatsApp";

type Draft = { id?: number; nome: string; empresa: string; tom: string; instrucoes: string; conhecimento: string };
type Msg = { role: "user" | "assistant"; text: string };
const blank: Draft = { nome: "", empresa: "", tom: "amigavel", instrucoes: "", conhecimento: "" };

export default function Agentes() {
  const supabase = createClient();
  const [list, setList] = useState<Agente[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState<number[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [test, setTest] = useState<Agente | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const [wa, setWa] = useState<Agente | null>(null);
  const [waForm, setWaForm] = useState({ phone: "", token: "", resposta: "", connected: false });
  const [waMsg, setWaMsg] = useState("");
  const [log, setLog] = useState<{ id: number; contato: string; direcao: string; texto: string; erro: string | null; created_at: string }[]>([]);

  const load = useCallback(async () => {
    const [{ data, error }, conns] = await Promise.all([
      supabase.from("agentes").select("id, nome, empresa, tom, instrucoes, conhecimento, ativo").order("created_at", { ascending: false }),
      supabase.from("agente_whatsapp").select("agente_id"),
    ]);
    setConnected(((conns.data as { agente_id: number }[]) ?? []).map((c) => c.agente_id));
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
    if (wa?.id === a.id) setWa(null);
    load();
  }

  async function openWa(a: Agente) {
    setWa(a); setTest(null); setDraft(null); setWaMsg("");
    const [c, m] = await Promise.all([
      supabase.from("agente_whatsapp").select("phone_number_id, resposta_padrao").eq("agente_id", a.id).maybeSingle(),
      supabase.from("whatsapp_mensagens").select("id, contato, direcao, texto, erro, created_at").eq("agente_id", a.id).order("created_at", { ascending: false }).limit(30),
    ]);
    setWaForm({ phone: c.data?.phone_number_id ?? "", token: "", resposta: c.data?.resposta_padrao ?? "", connected: Boolean(c.data) });
    setLog((m.data as typeof log) ?? []);
  }

  async function saveWa() {
    if (!wa) return;
    setWaMsg("");
    const res = await fetch("/api/agentes/whatsapp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ agente_id: wa.id, phone_number_id: waForm.phone, access_token: waForm.token, resposta_padrao: waForm.resposta }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { setWaMsg(out.error ?? "Não foi possível salvar."); return; }
    setWaMsg("WhatsApp conectado."); openWa(wa);
  }

  async function disconnectWa() {
    if (!wa || !confirm("Desconectar o WhatsApp deste agente?")) return;
    await fetch(`/api/agentes/whatsapp?agente_id=${wa.id}`, { method: "DELETE" });
    openWa(wa);
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
      <ol className="onb" aria-label="Primeiros passos">
        <li className={list.length ? "done" : "now"}><b>1. Crie um agente</b><span className="mut">Nome, tom de voz e o que ele sabe sobre o seu negócio.</span></li>
        <li className={list.some((a) => connected.includes(a.id)) ? "done" : list.length ? "now" : ""}><b>2. Conecte o WhatsApp</b><span className="mut">Clique em WhatsApp no agente e depois em Conectar WhatsApp.</span></li>
        <li className={list.some((a) => connected.includes(a.id)) ? "now" : ""}><b>3. Teste</b><span className="mut">Mande uma mensagem para o seu número e veja a resposta.</span></li>
      </ol>
      {err && <p className="err">{err}</p>}
      <div className="twocol">
        <section className="panel">
          <div className="actions"><button onClick={() => { setDraft({ ...blank }); setErr(""); }}>+ Novo agente</button></div>
          {!loaded && <p className="mut">Carregando…</p>}
          {loaded && !list.length && <p className="empty">Nenhum agente ainda. Crie o primeiro.</p>}
          {list.map((a) => (
            <div key={a.id} className="citem">
              <b>{a.nome}</b>
              <span className="mut">{a.empresa ?? "Sem empresa"} · {TONS[a.tom]} · {connected.includes(a.id) ? "WhatsApp conectado" : "WhatsApp não conectado"}</span>
              <div className="actions">
                <button className="sm" onClick={() => { setTest(a); setWa(null); setMsgs([]); }}>Testar</button>
                <button className="ghost sm" onClick={() => openWa(a)}>WhatsApp</button>
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
          ) : wa ? (
            <div className="formwrap">
              <h2>WhatsApp · {wa.nome} {waForm.connected && <span className="badge">conectado</span>}</h2>
              <ConnectWhatsApp agenteId={wa.id} resposta={waForm.resposta} onDone={() => openWa(wa)} />
              <details>
                <summary className="mut">Conexão manual (avançado)</summary>
              <p className="mut">No <b>Meta for Developers</b> (app com o produto WhatsApp), em <b>Configuração da API</b>, copie o <b>ID do número de telefone</b> e gere um <b>token de acesso permanente</b>. Depois, em <b>Configuração → Webhook</b>, cole a URL e o token de verificação abaixo e assine o campo <code>messages</code>.</p>
              <label>URL do webhook<input readOnly value={typeof window === "undefined" ? "" : `${window.location.origin}/api/whatsapp/webhook`} onFocus={(e) => e.currentTarget.select()} /></label>
              <label>ID do número de telefone<input value={waForm.phone} inputMode="numeric" onChange={(e) => setWaForm({ ...waForm, phone: e.target.value })} placeholder="Ex.: 123456789012345" /></label>
              <label>Token de acesso{waForm.connected && " (deixe vazio para manter o atual)"}<input type="password" autoComplete="off" value={waForm.token} onChange={(e) => setWaForm({ ...waForm, token: e.target.value })} placeholder={waForm.connected ? "••••••••" : "EAAG…"} /></label>
                {!waForm.connected && <div className="actions"><button onClick={saveWa}>Conectar manualmente</button></div>}
              </details>
              <label>Resposta padrão (usada enquanto a IA não está ligada)<textarea rows={3} maxLength={1000} value={waForm.resposta} onChange={(e) => setWaForm({ ...waForm, resposta: e.target.value })} placeholder="Olá! Recebemos sua mensagem e já vamos responder." /></label>
              {waMsg && <p className={waMsg.startsWith("WhatsApp") ? "mut" : "err"}>{waMsg}</p>}
              <div className="actions">
                {waForm.connected && <button onClick={saveWa}>Salvar</button>}
                {waForm.connected && <button className="ghost" onClick={disconnectWa}>Desconectar</button>}
                <button className="ghost" onClick={() => setWa(null)}>Fechar</button>
              </div>
              {waForm.connected && (
                <>
                  <h3>Últimas mensagens</h3>
                  {!log.length && <p className="mut">Nenhuma mensagem recebida ainda.</p>}
                  {log.map((l) => <div key={l.id} className={`bubble ${l.direcao === "saida" ? "" : "me"}`}><span className="mut">{l.contato} · {l.direcao === "saida" ? "agente" : "cliente"}</span><br />{l.texto}{l.erro && <><br /><span className="err">Não enviada: {l.erro}</span></>}</div>)}
                </>
              )}
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
