import { Acc, Footer, Nav, Rating, stars, waLink, type Ctx } from "../shared";

const Wave = ({ flip }: { flip?: boolean }) => (
  <svg className={`vi-wave ${flip ? "flip" : ""}`} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden><path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="currentColor" /></svg>
);

// Vitrine: divertido e comercial. Entrada com "pulo", foto flutuante, ondas entre seções, carrossel e confete.
export default function Vitrine({ c, photo }: Ctx) {
  const wa = waLink(c), b = c.business, ph = c.photos ?? [];
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
          <div className={`st-shot vi-float ${ph.length ? "" : "empty"}`} data-rv>
            {ph.length ? <img src={photo(0)} alt={b.name} data-full={photo(0)} /> : <span>{b.name}</span>}
            {b.rating && <div className="vi-sticker">★ {b.rating}</div>}
          </div>
        </div>
      </header>
      <Wave />

      <section className="st-sec vi-sec">
        <div className="st-wrap">
          <h2 className="vi-title" data-rv><mark>{c.services.title}</mark></h2>
          <div className="st-tiles">
            {c.services.items.map((s, i) => <div key={i} className="st-tile" data-rv><h3>{s.title}</h3><p>{s.text}</p></div>)}
          </div>
          <p className="st-lead vi-about" data-rv>{c.about.text}</p>
        </div>
      </section>

      {ph.length > 1 && (
        <section className="st-sec vi-alt">
          <div className="st-wrap">
            <h2 className="vi-title" data-rv><mark>Um pouco do nosso dia</mark></h2>
            <div className="vi-car" data-car data-rv>
              <div className="vi-track">{ph.slice(1).map((_, i) => <img key={i} src={photo(i + 1)} data-full={photo(i + 1)} alt={`Foto ${i + 1}`} loading="lazy" />)}</div>
              <button type="button" className="vi-arrow l" data-car-prev aria-label="Anterior">‹</button>
              <button type="button" className="vi-arrow r" data-car-next aria-label="Próxima">›</button>
            </div>
          </div>
        </section>
      )}

      <section className="st-cta"><div className="st-wrap"><h2 data-rv>Vamos conversar?</h2>{wa && <a className="st-btn inv" href={wa} data-confetti>{c.hero.cta}</a>}</div></section>

      {c.reviews.items.length > 0 && (
        <section className="st-sec vi-sec">
          <div className="st-wrap">
            <h2 className="vi-title" data-rv><mark>{c.reviews.title}</mark></h2>
            <div className="st-grid">
              {c.reviews.items.map((r, i) => (
                <figure key={i} className="vi-bubble" data-rv><div className="st-stars">{stars(r.rating)}</div><blockquote>{r.text}</blockquote><figcaption>— {r.author}</figcaption></figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {c.faq && c.faq.length > 0 && (
        <section className="st-sec vi-alt">
          <div className="st-wrap st-narrow"><h2 className="vi-title" data-rv><mark>Perguntas frequentes</mark></h2><Acc c={c} /></div>
        </section>
      )}

      <section className="st-sec vi-sec">
        <div className="st-wrap st-two">
          <div className="vi-info" data-rv>
            <h2>Onde estamos</h2>
            <p className="st-lead">{b.address || "Endereço em breve."}</p>
            {b.phone && <p><b>Telefone:</b> {b.phone}</p>}
            <a className="st-btn" href={b.mapsUrl}>Abrir no mapa</a>
          </div>
          {c.hours.length > 0 && <div className="vi-info" data-rv><h2>Horários</h2><ul className="st-hours">{c.hours.map((h, i) => <li key={i}>{h}</li>)}</ul></div>}
        </div>
      </section>
      <Footer c={c} />
      {wa && <div className="vi-sticky" data-sticky><a className="st-btn" href={wa} data-confetti>{c.hero.cta}</a></div>}
    </div>
  );
}
