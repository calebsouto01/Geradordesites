"use client";
import { useEffect } from "react";

// Esc fecha a tela aberta e volta para a anterior, uma por vez: painel de abertura, folha de finalização,
// depois a janela (modal) do topo. Reaproveita o fechamento de cada janela (clique no fundo), então respeita
// os casos em que ela não pode fechar (ex.: enquanto cria o site).
export default function EscClose() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.isComposing) return;
      const pop = document.querySelector<HTMLElement>(".openpop .iconbtn");
      if (pop) { pop.click(); e.preventDefault(); return; }
      const sheet = document.querySelector<HTMLElement>(".endsheet");
      if (sheet) {
        const back = [...sheet.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.trim().startsWith("←"));
        if (back) { back.click(); e.preventDefault(); return; }
      }
      const modals = document.querySelectorAll<HTMLElement>(".modal");
      const top = modals[modals.length - 1];
      if (top) { top.click(); e.preventDefault(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
