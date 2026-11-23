"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [password2, setPassword2] = useState("");
  const [accept, setAccept] = useState(false);
  // Vindo da página da plataforma (?cadastro=1): já abre em "Criar conta".
  useEffect(() => { if (new URLSearchParams(window.location.search).get("cadastro") === "1") setMode("up"); }, []);
  // Link de recuperação de senha: o Supabase abre uma sessão temporária e avisa com PASSWORD_RECOVERY.
  useEffect(() => {
    if (/type=recovery/.test(window.location.hash)) setMode("reset");
    const { data } = createClient().auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") setMode("reset"); });
    return () => data.subscription.unsubscribe();
  }, []);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (mode === "reset") {
      if (password !== password2) return setMsg("As senhas não são iguais.");
      setBusy(true);
      const { error } = await createClient().auth.updateUser({ password });
      setBusy(false);
      if (error) return setMsg(error.message);
      router.replace("/");
      router.refresh();
      return;
    }
    if (mode === "up" && !accept) return setMsg("Aceite os termos de uso e a política de privacidade para criar a conta.");
    setBusy(true);
    const supabase = createClient();
    const { data, error } = mode === "in" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message.includes("Invalid login") ? "E-mail ou senha incorretos." : /fetch|network/i.test(error.message) ? "Não foi possível conectar ao servidor. Tente novamente em instantes." : error.message);
    if (!data.session) return setMsg("Conta criada. Confirme seu e-mail para entrar.");
    router.replace("/");
    router.refresh();
  }

  async function forgot() {
    if (!email) return setMsg("Digite seu e-mail para receber o link de recuperação.");
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    setMsg(error ? error.message : "Enviamos um link de recuperação para o seu e-mail.");
  }

  return (
    <div className="auth">
      <section className="hero">
        <span className="brand"><span className="logo">◎</span>Gerador de Sites</span>
        <h1>Encontre negócios ótimos que ainda não têm site.</h1>
        <ul>
          <li>Busca no Google só com empresas bem avaliadas e sem site</li>
          <li>Site pronto em minutos, com as cores e as fotos do cliente</li>
          <li>Funil de vendas do primeiro contato ao fechamento</li>
        </ul>
      </section>
      <section className="formwrap">
        <form onSubmit={submit} className="authform">
          <div>
            <h2>{mode === "in" ? "Entrar" : mode === "up" ? "Criar conta" : "Nova senha"}</h2>
            <span className="mut">{mode === "in" ? "Acesse sua conta para continuar." : mode === "up" ? "Você começa com 6 créditos grátis para testar." : "Defina uma nova senha para a sua conta."}</span>
          </div>
          {mode !== "reset" && <label className="f">E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>}
          <label className="f">{mode === "reset" ? "Nova senha" : "Senha"}
            <span className="pwrow">
              <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete={mode === "in" ? "current-password" : "new-password"} />
              <button type="button" className="pwtoggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Ocultar senha" : "Mostrar senha"} aria-pressed={show}>{show ? "Ocultar" : "Mostrar"}</button>
            </span>
          </label>
          {mode === "reset" && <label className="f">Repita a nova senha<input type={show ? "text" : "password"} value={password2} onChange={(e) => setPassword2(e.target.value)} minLength={8} required autoComplete="new-password" /></label>}
          {mode === "up" && (
            <label className="mut" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}>
              <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} style={{ width: 18, minHeight: 18, marginTop: 2 }} />
              <span>Li e aceito os <Link href="/termos" target="_blank" style={{ textDecoration: "underline" }}>Termos de uso</Link> e a <Link href="/privacidade" target="_blank" style={{ textDecoration: "underline" }}>Política de privacidade</Link>.</span>
            </label>
          )}
          <button disabled={busy}>{busy ? "Aguarde…" : mode === "in" ? "Entrar" : mode === "up" ? "Cadastrar" : "Salvar nova senha"}</button>
          {msg && <span className="err">{msg}</span>}
          {mode !== "reset" && <button type="button" className="ghost" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>{mode === "in" ? "Não tenho conta" : "Já tenho conta"}</button>}
          {mode === "in" && <button type="button" className="ghost sm" onClick={forgot}>Esqueci minha senha</button>}
        </form>
      </section>
    </div>
  );
}
