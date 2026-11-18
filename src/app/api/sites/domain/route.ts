import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { allowUser, tooMany } from "@/lib/rate";

const DOMAIN = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

const INSTRUCTIONS =
  "Aponte o DNS do domínio:\n• Para www.seudominio.com.br: registro CNAME para cname.vercel-dns.com\n• Para seudominio.com.br (sem www): registro A para 76.76.21.21\nO certificado HTTPS é emitido automaticamente e pode levar alguns minutos.";

// Registra o domínio próprio de um site publicado. Se houver VERCEL_TOKEN e VERCEL_PROJECT_ID, também o cadastra no projeto.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  if (!(await allowUser(supabase, "domain", 10, 3600))) return tooMany();

  const body = await request.json().catch(() => null);
  const siteId = Number(body?.siteId), domain = String(body?.domain ?? "").trim().toLowerCase();
  if (!Number.isInteger(siteId) || !DOMAIN.test(domain)) return NextResponse.json({ error: "Informe um domínio válido, como www.cliente.com.br." }, { status: 400 });
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://geradordesites-plum.vercel.app").hostname, root = process.env.ROOT_DOMAIN?.toLowerCase();
  if (domain === appHost || domain.endsWith(".vercel.app") || (root && (domain === root || domain.endsWith(`.${root}`))))
    return NextResponse.json({ error: "Esse domínio pertence ao sistema. Use o domínio do cliente." }, { status: 400 });

  const { data: site } = await supabase.from("sites").select("id, status").eq("id", siteId).maybeSingle();
  if (!site) return NextResponse.json({ error: "Site não encontrado." }, { status: 404 });
  if (site.status !== "publicado") return NextResponse.json({ error: "Publique o site antes de conectar um domínio." }, { status: 400 });

  const { error } = await supabase.from("sites").update({ custom_domain: domain }).eq("id", siteId);
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Esse domínio já está em uso em outro site." : "Não foi possível salvar o domínio." }, { status: error.code === "23505" ? 409 : 500 });

  const token = process.env.VERCEL_TOKEN, project = process.env.VERCEL_PROJECT_ID;
  if (!token || !project) return NextResponse.json({ ok: true, instructions: `${INSTRUCTIONS}\nDepois, cadastre este domínio no projeto da Vercel (Settings → Domains).` });
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : "";
  const res = await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/domains${team}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ name: domain }),
  });
  if (!res.ok && res.status !== 409) return NextResponse.json({ ok: true, instructions: `${INSTRUCTIONS}\nNão foi possível cadastrar o domínio automaticamente; adicione-o em Vercel → Settings → Domains.` });
  return NextResponse.json({ ok: true, instructions: INSTRUCTIONS });
}
