"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    setTheme(next);
  }

  return (
    <button className="themebtn" onClick={toggle} aria-label="Alternar tema claro/escuro">
      <span className="ico">{theme === "light" ? "☾" : "☀"}</span>
      {theme === "light" ? "Tema escuro" : "Tema claro"}
    </button>
  );
}
