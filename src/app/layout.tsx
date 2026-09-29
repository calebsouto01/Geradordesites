import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Gerador de Sites — Prospecção" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return (
    <html lang="pt-BR">
      <body>
        {data.user && (
          <nav>
            <strong>Prospecção</strong>
            <Link href="/">Buscar</Link>
            <Link href="/funil">Funil</Link>
            <span className="sp" />
            <form action="/api/logout" method="post"><button className="ghost">Sair</button></form>
          </nav>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
