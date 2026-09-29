import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = { title: "Prospecção — Gerador de Sites" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const quota = data.user ? (await supabase.rpc("quota_remaining")).data : null;
  const level = quota === 0 ? "zero" : quota !== null && quota <= 5 ? "low" : "";
  return (
    <html lang="pt-BR">
      <body>
        {data.user && (
          <header className="nav">
            <Link href="/" className="brand"><span className="logo">◎</span>Prospecção</Link>
            <NavLinks />
            <span className="sp" />
            {quota !== null && <span className={`chip ${level}`}>Buscas restantes: <b>{quota}</b></span>}
            <form action="/api/logout" method="post"><button className="ghost sm">Sair</button></form>
          </header>
        )}
        {data.user ? <main>{children}</main> : children}
      </body>
    </html>
  );
}
