import type { ReactNode } from "react";
import type { LayoutKey, SectionKey, SiteContent } from "@/lib/site/types";
import { differentialsOf, hasData, numbersOf, resolveSections } from "@/lib/site/sections";

export type Ctx = { c: SiteContent; photo: (i: number) => string };

export const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

export const waLink = (c: SiteContent) =>
  c.business.whatsapp ? `https://wa.me/${c.business.whatsapp}?text=${encodeURIComponent(`Olá! Vi o site da ${c.business.name} e gostaria de mais informações.`)}` : "";

export function Nav({ c }: { c: SiteContent }) {
  const wa = waLink(c);
  return (
    <nav className="st-nav">
      <div className="st-wrap st-navin">
        {c.logoUrl ? <img className="st-logo" src={c.logoUrl} alt={c.business.name} /> : <b className="st-brand">{c.business.name}</b>}
        {wa && <a className="st-btn sm" href={wa} data-mag>WhatsApp</a>}
      </div>
    </nav>
  );
}

// Números com contagem animada (o texto final já vem no HTML, então funciona sem JavaScript).
export function Rating({ c }: { c: SiteContent }) {
  const b = c.business;
  if (!b.rating) return null;
  return (
    <div className="st-rating">
      <span>{stars(b.rating)}</span> <b data-count={b.rating} data-dec="1">{b.rating}</b> no Google
      {b.ratingCount ? <> · <b data-count={b.ratingCount}>{b.ratingCount}</b> avaliações</> : null}
    </div>
  );
}

export function Acc({ c }: { c: SiteContent }) {
  return (
    <>
      {(c.faq ?? []).map((f, i) => (
        <div key={i} className="fq" data-rv>
          <button type="button" className="fq-q" aria-expanded="false"><span>{f.q}</span><i aria-hidden /></button>
          <div className="fq-a"><div><p>{f.a}</p></div></div>
        </div>
      ))}
    </>
  );
}

export function Footer({ c }: { c: SiteContent }) {
  const authors = [...new Set((c.photos ?? []).map((p) => p.author))].slice(0, 4);
  return (
    <footer className="st-foot">
      <div>© {new Date().getFullYear()} {c.business.name}</div>
      {authors.length > 0 && <div className="st-attr">Fotos: {authors.join(", ")} · via Google Maps</div>}
    </footer>
  );
}

/* ===== Seções configuráveis ===== */

// Título de seção: cada layout usa o seu estilo (etiqueta, número em caixa alta ou marca-texto).
export function Heading({ layout, eyebrow, children }: { layout: LayoutKey; eyebrow?: string; children: ReactNode }) {
  if (layout === "moderno") return <div className="mo-head" data-rv><h2>{children}</h2></div>;
  if (layout === "vitrine") return <h2 className="vi-title" data-rv><mark>{children}</mark></h2>;
  return <>{eyebrow && <span className="cl-eyebrow" data-rv>{eyebrow}</span>}<h2 data-rv>{children}</h2></>;
}

type G = { c: SiteContent; layout: LayoutKey };
const Sec = ({ alt, children, id }: { alt?: boolean; children: ReactNode; id?: string }) => (
  <section className={`st-sec ${alt ? "alt" : ""}`} id={id}><div className="st-wrap">{children}</div></section>
);
const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

export function Numeros({ c }: G) {
  return (
    <section className="st-sec sx-num"><div className="st-wrap"><div className="sx-nums">
      {numbersOf(c).map((n, i) => (
        <div key={i} data-rv><b data-count={n.value} data-dec={n.dec ?? 0}>{n.value.toFixed(n.dec ?? 0)}</b><span>{n.label}</span></div>
      ))}
    </div></div></section>
  );
}

export function Diferenciais({ c, layout }: G) {
  return (
    <Sec alt><Heading layout={layout} eyebrow="Por que nos escolher">Nossos diferenciais</Heading>
      <div className="sx-diff">{differentialsOf(c).map((d, i) => <div key={i} className="sx-card" data-rv><i>✓</i><h3>{d.title}</h3><p>{d.text}</p></div>)}</div>
    </Sec>
  );
}

export function ComoFunciona({ c, layout }: G) {
  return (
    <Sec><Heading layout={layout} eyebrow="Passo a passo">Como funciona</Heading>
      <ol className="sx-steps">{(c.steps ?? []).map((s, i) => <li key={i} data-rv><span>{i + 1}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></li>)}</ol>
    </Sec>
  );
}

export function Planos({ c, layout }: G) {
  const wa = waLink(c);
  return (
    <Sec alt><Heading layout={layout} eyebrow="Investimento">Planos e preços</Heading>
      <div className="sx-plans">{(c.plans ?? []).map((p, i) => (
        <div key={i} className="sx-plan" data-rv><h3>{p.name}</h3>{p.price && <div className="sx-price">{p.price}</div>}{p.text && <p>{p.text}</p>}{wa && <a className="st-btn" href={wa}>Quero este</a>}</div>
      ))}</div>
    </Sec>
  );
}

export function Catalogo({ c, layout }: G) {
  return (
    <Sec><Heading layout={layout} eyebrow="Nossas opções">Cardápio e catálogo</Heading>
      <ul className="sx-cat">{(c.catalog ?? []).map((p, i) => (
        <li key={i} data-rv><div><b>{p.name}</b>{p.text && <p>{p.text}</p>}</div>{p.price && <span>{p.price}</span>}</li>
      ))}</ul>
    </Sec>
  );
}

export function Promo({ c }: G) {
  const wa = waLink(c);
  return (
    <section className="st-sec sx-promo-wrap"><div className="st-wrap"><div className="sx-promo" data-rv>
      <span>Promoção</span><h2>{c.promo?.title}</h2>{c.promo?.text && <p>{c.promo.text}</p>}{wa && <a className="st-btn inv" href={wa} data-confetti>Aproveitar</a>}
    </div></div></section>
  );
}

export function Equipe({ c, layout }: G) {
  return (
    <Sec alt><Heading layout={layout} eyebrow="Quem atende você">Nossa equipe</Heading>
      <div className="sx-team">{(c.team ?? []).map((m, i) => <div key={i} className="sx-member" data-rv><i>{initials(m.name)}</i><b>{m.name}</b><span>{m.role}</span></div>)}</div>
    </Sec>
  );
}

export function CtaBand({ c }: G) {
  const wa = waLink(c);
  return (
    <section className="st-cta"><div className="st-wrap"><h2 data-rv>Peça pelo WhatsApp</h2><p data-rv>Mande uma mensagem e responderemos o quanto antes.</p>{wa && <a className="st-btn inv" href={wa} data-confetti>{c.hero.cta}</a>}</div></section>
  );
}

// Mapa incorporado (sem chave: consulta pelo endereço).
export function MapEmbed({ c }: { c: SiteContent }) {
  const q = c.business.address || c.business.name;
  if (!q) return null;
  return <iframe className="st-map" loading="lazy" title="Mapa" src={`https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`} referrerPolicy="no-referrer-when-downgrade" />;
}

export function Contato({ c, layout }: G) {
  const b = c.business;
  return (
    <Sec alt id="contato"><Heading layout={layout} eyebrow="Contato">Onde estamos</Heading>
      <div className="st-two sx-contact">
        <div data-rv>
          <p className="st-lead">{b.address || "Endereço em breve."}</p>
          {b.phone && <p><b>Telefone:</b> {b.phone}</p>}
          {c.hours.length > 0 && <ul className="st-hours">{c.hours.map((h, i) => <li key={i}>{h}</li>)}</ul>}
          <a className="st-btn" href={b.mapsUrl}>Abrir no mapa</a>
        </div>
        <div data-rv><MapEmbed c={c} /></div>
      </div>
    </Sec>
  );
}

// Percorre as seções na ordem do layout (ou do usuário), pulando as desligadas e as sem dados.
export function renderSections(c: SiteContent, layout: LayoutKey, custom: Partial<Record<SectionKey, () => ReactNode>>) {
  const generic: Partial<Record<SectionKey, () => ReactNode>> = {
    numeros: () => <Numeros c={c} layout={layout} />, diferenciais: () => <Diferenciais c={c} layout={layout} />,
    comofunciona: () => <ComoFunciona c={c} layout={layout} />, planos: () => <Planos c={c} layout={layout} />,
    catalogo: () => <Catalogo c={c} layout={layout} />, promo: () => <Promo c={c} layout={layout} />,
    equipe: () => <Equipe c={c} layout={layout} />, cta: () => <CtaBand c={c} layout={layout} />, contato: () => <Contato c={c} layout={layout} />,
  };
  return resolveSections(c, layout)
    .filter((s) => s.on && hasData(s.key, c))
    .map((s) => { const r = custom[s.key] ?? generic[s.key]; return r ? <div key={s.key} className={`sec-${s.key}`} style={{ display: "contents" }}>{r()}</div> : null; });
}
