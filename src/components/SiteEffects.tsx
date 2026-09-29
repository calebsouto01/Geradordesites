"use client";
import { useEffect } from "react";
import type { LayoutKey } from "@/lib/site/types";
import * as fx from "./site/effects";

// Cada layout tem o seu próprio conjunto de efeitos.
export default function SiteEffects({ layout }: { layout: LayoutKey }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".st");
    if (!root) return;
    const offs = [fx.accordion(), fx.lightbox(), fx.counters(), fx.navShadow()];
    if (layout === "classico") offs.push(fx.reveal(root, 110));
    if (layout === "moderno") offs.push(fx.reveal(root, 70), fx.progressBar(), fx.tilt(), fx.spotlight(), fx.magnetic());
    if (layout === "vitrine") offs.push(fx.reveal(root, 120), fx.carousel(), fx.confetti(), fx.stickyCta());
    return () => offs.forEach((f) => f());
  }, [layout]);
  return null;
}
