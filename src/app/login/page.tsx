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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const supabase = createClient();
    const { data, error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);
    if (!data.session) return setMsg("Confirme seu e-mail para entrar.");
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card" style={{ maxWidth: 360, margin: "80px auto" }}>
      <h2>{mode === "in" ? "Entrar" : "Criar conta"}</h2>
      <div className="row" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        <button>{mode === "in" ? "Entrar" : "Cadastrar"}</button>
        {msg && <span className="err">{msg}</span>}
        <button type="button" className="ghost" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Não tenho conta" : "Já tenho conta"}
        </button>
      </div>
    </form>
  );
}
