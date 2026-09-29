import type { SiteContent } from "@/lib/site/types";

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
