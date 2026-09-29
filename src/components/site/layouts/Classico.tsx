import { Acc, Footer, Nav, Rating, stars, waLink, type Ctx } from "../shared";

// Clássico: elegante e sóbrio. Títulos com traço, cartões suaves, depoimentos em citação.
export default function Classico({ c, photo }: Ctx) {
  const wa = waLink(c), b = c.business, ph = c.photos ?? [];
  return (
    <div className="lay-classico">
      <Nav c={c} />
      <header className="st-hero" style={ph.length ? { backgroundImage: `linear-gradient(135deg,color-mix(in srgb,var(--accent) 88%,#000) 0%,color-mix(in srgb,var(--accent2) 70%,transparent) 100%),url(${photo(0)})` } : undefined}>
        <div className="st-wrap cl-hero">
          <span className="st-tag" data-rv>{b.category || "Negócio local"}</span>
          <h1 data-rv>{c.hero.headline}</h1>
          <p data-rv>{c.hero.subheadline}</p>
          <div className="st-actions" data-rv>
            {wa && <a className="st-btn inv" href={wa}>{c.hero.cta}</a>}
            <a className="st-btn ghost" href={b.mapsUrl}>Como chegar</a>
          </div>
          <div data-rv><Rating c={c} /></div>
        </div>
      </header>

      <section className="st-sec">
        <div className="st-wrap st-two">
          <div>
            <span className="cl-eyebrow" data-rv>Sobre nós</span>
            <h2 data-rv>{c.about.title}</h2>
            <p className="st-lead" data-rv>{c.about.text}</p>
          </div>
          {ph.length > 1 && <img className="st-side" data-rv src={photo(1)} alt={b.name} loading="lazy" data-full={photo(1)} />}
        </div>
      </section>

      <section className="st-sec alt">
        <div className="st-wrap">
          <span className="cl-eyebrow" data-rv>O que fazemos</span>
          <h2 data-rv>{c.services.title}</h2>
          <div className="st-grid">
            {c.services.items.map((s, i) => (
              <div key={i} className="st-card cl-card" data-rv><span className="cl-num">{i + 1}</span><h3>{s.title}</h3><p>{s.text}</p></div>
            ))}
          </div>
        </div>
      </section>

      {ph.length > 2 && (
        <section className="st-sec">
          <div className="st-wrap">
            <span className="cl-eyebrow" data-rv>Galeria</span>
            <h2 data-rv>Conheça o espaço</h2>
            <div className="st-gal">
              {ph.slice(2).map((_, i) => <img key={i} data-rv src={photo(i + 2)} data-full={photo(i + 2)} alt={`Foto ${i + 1}`} loading="lazy" />)}
            </div>
          </div>
        </section>
      )}

      {c.reviews.items.length > 0 && (
        <section className="st-sec alt">
          <div className="st-wrap st-narrow">
            <span className="cl-eyebrow" data-rv>Depoimentos</span>
            <h2 data-rv>{c.reviews.title}</h2>
            {c.reviews.items.map((r, i) => (
              <figure key={i} className="cl-quote" data-rv>
                <blockquote>{r.text}</blockquote>
                <figcaption><span className="st-stars">{stars(r.rating)}</span> {r.author} · avaliação no Google</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {c.faq && c.faq.length > 0 && (
        <section className="st-sec">
          <div className="st-wrap st-narrow"><span className="cl-eyebrow" data-rv>Dúvidas</span><h2 data-rv>Perguntas frequentes</h2><Acc c={c} /></div>
        </section>
      )}

      <section className="st-sec alt">
        <div className="st-wrap st-two">
          <div data-rv>
            <span className="cl-eyebrow">Contato</span><h2>Onde estamos</h2>
            <p className="st-lead">{b.address || "Endereço em breve."}</p>
            {b.phone && <p><b>Telefone:</b> {b.phone}</p>}
            <a className="st-btn" href={b.mapsUrl}>Abrir no mapa</a>
          </div>
          {c.hours.length > 0 && <div data-rv><h2>Horários</h2><ul className="st-hours">{c.hours.map((h, i) => <li key={i}>{h}</li>)}</ul></div>}
        </div>
      </section>
      <Footer c={c} />
    </div>
  );
}
