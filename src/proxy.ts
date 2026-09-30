import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas abertas: sites públicos, páginas legais, login e endpoints públicos com limite próprio.
const PUBLIC = [/^\/login/, /^\/p\//, /^\/preview/, /^\/termos/, /^\/privacidade/, /^\/denuncia/, /^\/api\/photo/, /^\/api\/site\//, /^\/api\/billing\/webhook/, /^\/sitemap/, /^\/robots/];

// Domínio próprio → slug do site (consulta ao banco com cache curto).
const domainCache = new Map<string, { slug: string | null; at: number }>();
async function slugForDomain(host: string): Promise<string | null> {
  const hit = domainCache.get(host);
  if (hit && Date.now() - hit.at < (hit.slug ? 60_000 : 30_000)) return hit.slug;
  let slug: string | null = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/site_slug_by_domain`, {
      method: "POST", headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, "Content-Type": "application/json" }, body: JSON.stringify({ p_domain: host }),
    });
    if (res.ok) { const j = await res.json(); slug = typeof j === "string" ? j : null; }
  } catch { /* sem domínio */ }
  domainCache.set(host, { slug, at: Date.now() });
  return slug;
}

export async function proxy(request: NextRequest) {
  // Subdomínio do site (ex.: joao.seudominio.com.br) → /p/joao
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const root = process.env.ROOT_DOMAIN?.toLowerCase();
  if (root && host.endsWith(`.${root}`) && host !== `www.${root}` && host !== `app.${root}`) {
    const slug = host.slice(0, -(root.length + 1));
    if (/^[a-z0-9-]+$/.test(slug)) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${slug}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Domínio próprio do cliente (qualquer host que não seja o do sistema)
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://geradordesites-plum.vercel.app").hostname;
  const known = !host || host === appHost || host === "localhost" || host.startsWith("127.") || host.endsWith(".vercel.app") || Boolean(root && (host === root || host.endsWith(`.${root}`)));
  if (!known) {
    const slug = await slugForDomain(host);
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/p/${slug}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  const path = request.nextUrl.pathname;
  if (PUBLIC.some((r) => r.test(path))) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    if (path.startsWith("/api")) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"] };
