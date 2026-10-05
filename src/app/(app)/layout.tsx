import Link from "next/link";
import { redirect } from "next/navigation";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "@/components/NavLinks";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: credits } = await supabase.rpc("credits_remaining");
  const level = credits === 0 ? "zero" : credits !== null && credits <= 9 ? "low" : "";
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand"><span className="logo">◎</span>Gerador de Sites</Link>
        <NavLinks />
        <span className="sp" />
        <ThemeToggle />
        <Link href="/plano" className={`quota ${level}`} title="Plano e créditos">
          <span className="mut">Créditos</span>
          <b>{(credits ?? 0) >= 100000 ? "∞" : credits ?? 0}</b>
          <span className="mut">{(credits ?? 0) >= 100000 ? "acesso livre" : "ver plano"}</span>
        </Link>
        <div className="who">
          <span className="mut" title={auth.user.email ?? ""}>{auth.user.email}</span>
          <form action="/api/logout" method="post"><button className="ghost sm">Sair</button></form>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
