"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/", "Início", "◎", "Início"],
  ["/busca", "Busca", "⌕", "Busca"],
  ["/sites", "Criar site", "✦", "Sites"],
  ["/funil", "Funil", "▦", "Funil"],
  ["/scripts", "Scripts de ligação", "☏", "Scripts"],
] as const;

export default function NavLinks() {
  const path = usePathname();
  return (
    <nav className="menu">
      {items.map(([href, label, icon, short]) => (
        <Link key={href} href={href} className={`navlink ${(href === "/" ? path === "/" : path.startsWith(href)) ? "on" : ""}`}>
          <span className="ico">{icon}</span><span className="lbl">{label}</span><span className="lbs">{short}</span>
        </Link>
      ))}
    </nav>
  );
}
