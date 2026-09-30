// JavaScript dos sites gerados: pequeno, escrito por nós, sem código vindo da IA.
type Off = () => void;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = () => window.matchMedia("(hover:hover) and (pointer:fine)").matches;
const $$ = <T extends HTMLElement>(s: string) => Array.from(document.querySelectorAll<T>(s));

export function reveal(root: HTMLElement, stagger = 90): Off {
  const els = $$("[data-rv]");
  const groups = new Map<Element, number>();
  els.forEach((el) => { const n = groups.get(el.parentElement!) ?? 0; el.style.setProperty("--d", `${n * stagger}ms`); groups.set(el.parentElement!, n + 1); });
  if (reduced()) { els.forEach((el) => el.classList.add("in")); return () => {}; }
  root.classList.add("fx");
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

export function counters(): Off {
  const els = $$("[data-count]");
  if (reduced()) return () => {};
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target as HTMLElement, to = Number(el.dataset.count), dec = Number(el.dataset.dec ?? 0), t0 = performance.now();
    const tick = (t: number) => { const p = Math.min(1, Math.max(0, (t - t0) / 1200)); el.textContent = (to * (1 - Math.pow(1 - p, 3))).toFixed(dec); if (p < 1) requestAnimationFrame(tick); else el.textContent = to.toFixed(dec); };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}

export function navShadow(): Off {
  const nav = document.querySelector(".st-nav");
  const on = () => nav?.classList.toggle("scrolled", window.scrollY > 8);
  on(); window.addEventListener("scroll", on, { passive: true });
  return () => window.removeEventListener("scroll", on);
}

export function accordion(): Off {
  const onClick = (e: MouseEvent) => {
    const q = (e.target as HTMLElement).closest<HTMLElement>(".fq-q");
    if (!q) return;
    const box = q.closest(".fq")!, open = box.classList.toggle("open");
    q.setAttribute("aria-expanded", String(open));
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

export function lightbox(): Off {
  const onClick = (e: MouseEvent) => {
    const img = (e.target as HTMLElement).closest<HTMLImageElement>("[data-full]");
    if (!img) return;
    const box = document.createElement("div");
    box.className = "st-lb";
    box.innerHTML = `<img src="${img.dataset.full ?? img.src}" alt="">`;
    box.onclick = () => box.remove();
    document.body.appendChild(box);
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

export function progressBar(): Off {
  const bar = document.querySelector<HTMLElement>("[data-progress]");
  if (!bar) return () => {};
  const on = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; };
  on(); window.addEventListener("scroll", on, { passive: true });
  return () => window.removeEventListener("scroll", on);
}

export function tilt(): Off {
  if (!fine() || reduced()) return () => {};
  const offs: Off[] = [];
  $$(".tilt").forEach((el) => {
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(0)`;
      el.style.setProperty("--mx", `${(x + 0.5) * 100}%`); el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
    };
    const leave = () => { el.style.transform = ""; };
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    offs.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
  });
  return () => offs.forEach((f) => f());
}

export function spotlight(): Off {
  if (!fine()) return () => {};
  const offs: Off[] = [];
  $$("[data-spot]").forEach((el) => {
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.setProperty("--mx", `${e.clientX - r.left}px`); el.style.setProperty("--my", `${e.clientY - r.top}px`); };
    el.addEventListener("pointermove", move);
    offs.push(() => el.removeEventListener("pointermove", move));
  });
  return () => offs.forEach((f) => f());
}

export function magnetic(): Off {
  if (!fine() || reduced()) return () => {};
  const offs: Off[] = [];
  $$("[data-mag]").forEach((el) => {
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px,${(e.clientY - r.top - r.height / 2) * 0.35}px)`; };
    const leave = () => { el.style.transform = ""; };
    el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
    offs.push(() => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); });
  });
  return () => offs.forEach((f) => f());
}

export function carousel(): Off {
  const onClick = (e: MouseEvent) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-car-prev],[data-car-next]");
    if (!b) return;
    const track = b.closest("[data-car]")?.querySelector<HTMLElement>(".vi-track");
    track?.scrollBy({ left: (b.hasAttribute("data-car-next") ? 1 : -1) * track.clientWidth * 0.8, behavior: "smooth" });
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

export function confetti(): Off {
  const onClick = (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-confetti]");
    if (!t || reduced()) return;
    const r = t.getBoundingClientRect(), icons = ["🎉", "✨", "⭐", "💥", "🎊"];
    for (let i = 0; i < 16; i++) {
      const s = document.createElement("span");
      s.className = "vi-conf"; s.textContent = icons[i % icons.length];
      s.style.left = `${r.left + r.width / 2}px`; s.style.top = `${r.top + r.height / 2}px`;
      s.style.setProperty("--x", `${(Math.random() - 0.5) * 260}px`); s.style.setProperty("--y", `${-40 - Math.random() * 200}px`); s.style.setProperty("--r", `${(Math.random() - 0.5) * 540}deg`);
      document.body.appendChild(s); setTimeout(() => s.remove(), 1000);
    }
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}

export function stickyCta(): Off {
  const bar = document.querySelector<HTMLElement>("[data-sticky]");
  if (!bar) return () => {};
  const on = () => bar.classList.toggle("show", scrollY > 500);
  on(); window.addEventListener("scroll", on, { passive: true });
  return () => window.removeEventListener("scroll", on);
}

// Métricas do cliente final: 1 visualização por sessão e cliques em WhatsApp e mapa.
export function tracking(slug: string): Off {
  const send = (kind: string) => { try { navigator.sendBeacon("/api/site/event", new Blob([JSON.stringify({ slug, kind })], { type: "application/json" })); } catch { /* sem métrica */ } };
  const key = `view:${slug}`;
  try { if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, "1"); send("view"); } } catch { send("view"); }
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!a) return;
    if (a.href.includes("wa.me")) send("whatsapp");
    else if (a.href.includes("google.com/maps")) send("mapa");
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
