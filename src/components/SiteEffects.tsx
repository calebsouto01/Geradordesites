"use client";
import { useEffect } from "react";
import type { LayoutKey } from "@/lib/site/types";
import * as fx from "./site/effects";

// Cada layout tem o seu próprio conjunto de efeitos.
export default function SiteEffects({ layout, track }: { layout: LayoutKey; track?: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".st");
    if (!root) return;
    // Modo PDF (?pdf=1): mostra tudo no estado final e abre a impressão (o navegador salva como PDF).
    if (new URLSearchParams(window.location.search).get("pdf") === "1") {
      document.documentElement.classList.add("pdfmode");
      root.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => el.classList.add("in"));
      root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => { el.textContent = Number(el.dataset.count).toFixed(Number(el.dataset.dec ?? 0)); });
      root.querySelectorAll<HTMLElement>(".st-faq, details").forEach((el) => el.setAttribute("open", ""));
      const t = window.setTimeout(() => window.print(), 1500);
      return () => window.clearTimeout(t);
    }
    const offs = [fx.accordion(), fx.lightbox(), fx.counters(), fx.navShadow()];
    if (layout === "classico") offs.push(fx.reveal(root, 110));
    if (layout === "moderno") offs.push(fx.reveal(root, 70), fx.progressBar(), fx.tilt(), fx.spotlight(), fx.magnetic());
    if (layout === "vitrine") offs.push(fx.reveal(root, 120), fx.carousel(), fx.confetti(), fx.stickyCta());
    if (track) offs.push(fx.tracking(track));
    return () => offs.forEach((f) => f());
  }, [layout, track]);
  return null;
}
