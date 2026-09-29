import { Acc, Footer, Heading, Nav, Rating, renderSections, stars, waLink, type Ctx } from "../shared";

const Wave = () => (
  <svg className="vi-wave" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden><path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="currentColor" /></svg>
);

// Vitrine: divertido e comercial. Venda primeiro: serviços, promoção, cardápio e chamada para o WhatsApp.
export default function Vitrine({ c, photo }: Ctx) {
  const wa = waLink(c), b = c.business, ph = c.photos ?? [];
  const off = c.media?.hero ? 0 : 1;
  const heroImg = c.media?.hero ?? (ph.length ? photo(0) : null);
  const L = "vitrine" as const;
  return (
    <div className="lay-vitrine">
      <Nav c={c} />
      <header className="vi-hero">
        <span className="vi-blob b1" aria-hidden /><span className="vi-blob b2" aria-hidden />
        <div className="st-wrap st-split">
          <div>
            <span className="st-tag" data-rv>{b.category || "Negócio local"}</span>
            <h1 data-rv>{c.hero.headline}</h1>
            <p data-rv>{c.hero.subheadline}</p>
            <div className="st-actions" data-rv>
              {wa && <a className="st-btn" href={wa} data-confetti>{c.hero.cta}</a>}
              <a className="st-btn ghost" href={b.mapsUrl}>Como chegar</a>
            </div>
            <div data-rv><Rating c={c} /></div>
          </div>
          <div className={`st-shot vi-float ${heroImg ? "" : "empty"}`} data-rv>
            {heroImg ? <img src={heroImg} alt={b.name} data-full={heroImg} /> : <span>{b.name}</span>}
            {b.rating && <div className="vi-sticker">★ {b.rating}</div>}
          </div>
        </div>
      </header>
      <Wave />

      {renderSections(c, L, {
        servicos: () => (
          <section className="st-sec vi-sec"><div className="st-wrap">
            <Heading layout={L}>{c.services.title}</Heading>
            <div className="st-tiles">{c.services.items.map((s, i) => <div key={i} className="st-tile" data-rv><h3>{s.title}</h3><p>{s.text}</p></div>)}</div>
          </div></section>
        ),
        sobre: () => <section className="st-sec vi-alt"><div className="st-wrap st-two"><div><Heading layout={L}>{c.about.title}</Heading><p className="st-lead" data-rv>{c.about.text}</p></div>{c.media?.sobre && <img className="st-side vi-side" data-rv src={c.media.sobre} data-full={c.media.sobre} alt={b.name} loading="lazy" />}</div></section>,
        galeria: () => (
          <section className="st-sec vi-alt"><div className="st-wrap">
            <Heading layout={L}>Um pouco do nosso dia</Heading>
            <div className="vi-car" data-car data-rv>
              <div className="vi-track">{ph.slice(off).map((_, i) => <img key={i} src={photo(i + off)} data-full={photo(i + off)} alt={`Foto ${i + 1}`} loading="lazy" />)}</div>
              <button type="button" className="vi-arrow l" data-car-prev aria-label="Anterior">‹</button>
              <button type="button" className="vi-arrow r" data-car-next aria-label="Próxima">›</button>
            </div>
          </div></section>
        ),
        depoimentos: () => (
          <section className="st-sec vi-sec"><div className="st-wrap">
            <Heading layout={L}>{c.reviews.title}</Heading>
            <div className="st-grid">{c.reviews.items.map((r, i) => <figure key={i} className="vi-bubble" data-rv><div className="st-stars">{stars(r.rating)}</div><blockquote>{r.text}</blockquote><figcaption>— {r.author}</figcaption></figure>)}</div>
          </div></section>
        ),
        faq: () => <section className="st-sec vi-alt"><div className="st-wrap st-narrow"><Heading layout={L}>Perguntas frequentes</Heading><Acc c={c} /></div></section>,
      })}
      <Footer c={c} />
      {wa && <div className="vi-sticky" data-sticky><a className="st-btn" href={wa} data-confetti>{c.hero.cta}</a></div>}
    </div>
  );
}
