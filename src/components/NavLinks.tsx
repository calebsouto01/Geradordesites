"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks() {
  const path = usePathname();
  const items = [["/", "Buscar"], ["/funil", "Funil"]] as const;
  return (
    <>
      {items.map(([href, label]) => (
        <Link key={href} href={href} className={`navlink ${path === href ? "on" : ""}`}>{label}</Link>
      ))}
    </>
  );
}
