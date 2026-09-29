"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(""); setBusy(true);
    const supabase = createClient();
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (!data.session) return setMsg("Conta criada. Confirme seu e-mail para entrar.");
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="auth">
      <section className="hero">
        <span className="brand"><span className="logo">◎</span>Prospecção</span>
        <h1>Encontre negócios ótimos que ainda não têm site.</h1>
        <ul>
          <li>Busca no Google só com empresas bem avaliadas e sem site</li>
          <li>Funil de vendas do primeiro contato ao fechamento</li>
          <li>WhatsApp direto no card de cada lead</li>
        </ul>
      </section>
      <section className="formwrap">
        <form onSubmit={submit} className="authform">
          <div>
            <h2>{mode === "in" ? "Entrar" : "Criar conta"}</h2>
            <span className="mut">{mode === "in" ? "Acesse sua conta para continuar." : "Comece a prospectar em minutos."}</span>
          </div>
          <label className="f">E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="f">Senha
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required
              autoComplete={mode === "in" ? "current-password" : "new-password"} />
          </label>
          <button disabled={busy}>{busy ? "Aguarde…" : mode === "in" ? "Entrar" : "Cadastrar"}</button>
          {msg && <span className="err">{msg}</span>}
          <button type="button" className="ghost" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>
            {mode === "in" ? "Não tenho conta" : "Já tenho conta"}
          </button>
        </form>
      </section>
    </div>
  );
}
