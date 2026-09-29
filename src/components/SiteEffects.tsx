"use client";
import { useEffect } from "react";

// Único JavaScript dos sites: revelar ao rolar e ampliar fotos da galeria.
export default function SiteEffects() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".rv");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    const onClick = (ev: MouseEvent) => {
      const img = (ev.target as HTMLElement).closest<HTMLImageElement>(".st-gal img");
      if (!img) return;
      const box = document.createElement("div");
      box.className = "st-lb";
      box.innerHTML = `<img src="${img.dataset.full ?? img.src}" alt="">`;
      box.onclick = () => box.remove();
      document.body.appendChild(box);
    };
    document.addEventListener("click", onClick);
    return () => { io.disconnect(); document.removeEventListener("click", onClick); };
  }, []);
  return null;
}
