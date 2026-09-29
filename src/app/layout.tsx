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
        <div className="shell">
          <aside className="side">
            <Link href="/" className="brand"><span className="logo">◎</span>Gerador de Sites</Link>
            <NavLinks />
            <span className="sp" />
            {quota !== null && (
              <div className={`quota ${level}`}>
                <span className="mut">Buscas restantes</span>
                <b>{quota}</b>
                <span className="mut">este mês</span>
              </div>
            )}
          </aside>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
