"use client";
import { useEffect } from "react";

// Revela os blocos [data-rv] ao rolar. Sem JavaScript ou com "reduzir movimento", tudo já aparece.
export default function Reveal() {
  useEffect(() => {
    const root = document.querySelector(".mk");
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const els = [...document.querySelectorAll<HTMLElement>("[data-rv]")];
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((el, i) => { el.style.setProperty("--d", `${(i % 4) * 70}ms`); io.observe(el); });
    root.classList.add("mk-rv");
    return () => { io.disconnect(); root.classList.remove("mk-rv"); };
  }, []);
  return null;
}
