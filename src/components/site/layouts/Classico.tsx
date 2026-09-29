import { Faq, Footer, Gallery, Location, Nav, Rating, Reviews, waLink, type Ctx } from "../shared";

export default function Classico({ c, photo }: Ctx) {
  const wa = waLink(c), b = c.business, hero = (c.photos ?? []).length ? photo(0) : null;
  return (
    <div className="lay-classico">
      <Nav c={c} />
      <header className="st-hero" style={hero ? { backgroundImage: `linear-gradient(135deg,color-mix(in srgb,var(--accent) 88%,#000) 0%,color-mix(in srgb,var(--accent2) 70%,transparent) 100%),url(${hero})` } : undefined}>
        <div className="st-wrap">
          <span className="st-tag">{b.category || "Negócio local"}</span>
          <h1>{c.hero.headline}</h1>
          <p>{c.hero.subheadline}</p>
          <div className="st-actions">
            {wa && <a className="st-btn inv" href={wa}>{c.hero.cta}</a>}
            <a className="st-btn ghost" href={b.mapsUrl}>Como chegar</a>
          </div>
          <Rating c={c} />
        </div>
      </header>
      <section className="st-sec">
        <div className="st-wrap st-two">
          <div className="rv"><h2>{c.about.title}</h2><p className="st-lead">{c.about.text}</p></div>
          {(c.photos ?? []).length > 1 && <img className="st-side rv" src={photo(1)} alt={b.name} loading="lazy" />}
        </div>
      </section>
      <section className="st-sec alt">
        <div className="st-wrap">
          <h2 className="rv">{c.services.title}</h2>
          <div className="st-grid">{c.services.items.map((s, i) => <div key={i} className="st-card rv"><h3>{s.title}</h3><p>{s.text}</p></div>)}</div>
        </div>
      </section>
      <Gallery photos={(c.photos ?? []).slice(2)} photo={(i) => photo(i + 2)} />
      <Reviews c={c} /><Faq c={c} /><Location c={c} /><Footer c={c} />
    </div>
  );
}
