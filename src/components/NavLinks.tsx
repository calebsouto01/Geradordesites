"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/", "Prospecção", "◎"],
  ["/busca", "Busca", "⌕"],
  ["/funil", "Funil", "▦"],
] as const;

export default function NavLinks() {
  const path = usePathname();
  return (
    <nav className="menu">
      {items.map(([href, label, icon]) => (
        <Link key={href} href={href} className={`navlink ${path === href ? "on" : ""}`}>
          <span className="ico">{icon}</span>{label}
        </Link>
      ))}
    </nav>
  );
}
