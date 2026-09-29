import Link from "next/link";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import NavLinks from "@/components/NavLinks";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: credits } = await createClient().rpc("credits_remaining");
  const level = credits === 0 ? "zero" : credits !== null && credits <= 9 ? "low" : "";
  return (
    <div className="shell">
      <aside className="side">
        <Link href="/" className="brand"><span className="logo">◎</span>Gerador de Sites</Link>
        <NavLinks />
        <span className="sp" />
        <ThemeToggle />
        {credits !== null && (
          <div className={`quota ${level}`}>
            <span className="mut">Créditos restantes</span>
            <b>{credits}</b>
            <span className="mut">este mês</span>
          </div>
        )}
      </aside>
      <main>{children}</main>
    </div>
  );
}
