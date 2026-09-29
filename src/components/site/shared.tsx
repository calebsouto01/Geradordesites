import type { Photo, SiteContent } from "@/lib/site/types";

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
        {wa && <a className="st-btn sm" href={wa}>WhatsApp</a>}
      </div>
    </nav>
  );
}

export function Gallery({ photos, photo, title = "Conheça o espaço" }: { photos: Photo[]; photo: (i: number) => string; title?: string }) {
  if (!photos.length) return null;
  return (
    <section className="st-sec">
      <div className="st-wrap">
        <h2 className="rv">{title}</h2>
        <div className="st-gal">
          {photos.map((p, i) => (
            <img key={`${p.name}${i}`} className="rv" src={photo(i)} alt={`${title} ${i + 1}`} loading="lazy" data-full={photo(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function Reviews({ c }: { c: SiteContent }) {
  if (!c.reviews.items.length) return null;
  return (
    <section className="st-sec alt">
      <div className="st-wrap">
        <h2 className="rv">{c.reviews.title}</h2>
        <div className="st-grid">
          {c.reviews.items.map((r, i) => (
            <figure key={i} className="st-card rv">
              <div className="st-stars">{stars(r.rating)}</div>
              <blockquote>“{r.text}”</blockquote>
              <figcaption>{r.author} · avaliação no Google</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq({ c }: { c: SiteContent }) {
  if (!c.faq?.length) return null;
  return (
    <section className="st-sec">
      <div className="st-wrap st-narrow">
        <h2 className="rv">Perguntas frequentes</h2>
        {c.faq.map((f, i) => (
          <details key={i} className="st-faq rv"><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </div>
    </section>
  );
}

export function Location({ c }: { c: SiteContent }) {
  const b = c.business;
  return (
    <section className="st-sec alt">
      <div className="st-wrap st-two">
        <div className="rv">
          <h2>Onde estamos</h2>
          <p className="st-lead">{b.address || "Endereço em breve."}</p>
          {b.phone && <p><b>Telefone:</b> {b.phone}</p>}
          <a className="st-btn" href={b.mapsUrl}>Abrir no mapa</a>
        </div>
        {c.hours.length > 0 && (
          <div className="rv">
            <h2>Horários</h2>
            <ul className="st-hours">{c.hours.map((h, i) => <li key={i}>{h}</li>)}</ul>
          </div>
        )}
      </div>
    </section>
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

export function Rating({ c }: { c: SiteContent }) {
  const b = c.business;
  if (!b.rating) return null;
  return <div className="st-rating"><span>{stars(b.rating)}</span> <b>{b.rating}</b> no Google{b.ratingCount ? ` · ${b.ratingCount} avaliações` : ""}</div>;
}
