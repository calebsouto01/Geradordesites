import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = { title: "Prospecção — Gerador de Sites" };
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { data: quota } = await createClient().rpc("quota_remaining");
  const level = quota === 0 ? "zero" : quota !== null && quota <= 5 ? "low" : "";
  return (
    <html lang="pt-BR">
      <body>
        <header className="nav">
          <Link href="/" className="brand"><span className="logo">◎</span>Prospecção</Link>
          <NavLinks />
          <span className="sp" />
          {quota !== null && <span className={`chip ${level}`}>Buscas restantes: <b>{quota}</b></span>}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
