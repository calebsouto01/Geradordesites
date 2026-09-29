import { Faq, Footer, Gallery, Location, Nav, Rating, Reviews, waLink, type Ctx } from "../shared";

export default function Vitrine({ c, photo }: Ctx) {
  const wa = waLink(c), b = c.business, hasPhoto = (c.photos ?? []).length > 0;
  return (
    <div className="lay-vitrine">
      <Nav c={c} />
      <header className="st-hero">
        <div className="st-wrap st-split">
          <div>
            <span className="st-tag">{b.category || "Negócio local"}</span>
            <h1>{c.hero.headline}</h1>
            <p>{c.hero.subheadline}</p>
            <div className="st-actions">
              {wa && <a className="st-btn" href={wa}>{c.hero.cta}</a>}
              <a className="st-btn ghost" href={b.mapsUrl}>Como chegar</a>
            </div>
            <Rating c={c} />
          </div>
          <div className={`st-shot ${hasPhoto ? "" : "empty"}`}>{hasPhoto ? <img src={photo(0)} alt={b.name} /> : <span>{b.name}</span>}</div>
        </div>
      </header>
      <section className="st-sec">
        <div className="st-wrap">
          <h2 className="rv">{c.services.title}</h2>
          <div className="st-tiles">
            {c.services.items.map((s, i) => <div key={i} className="st-tile rv"><h3>{s.title}</h3><p>{s.text}</p></div>)}
          </div>
          <p className="st-lead rv" style={{ marginTop: 34 }}>{c.about.text}</p>
        </div>
      </section>
      <Gallery photos={(c.photos ?? []).slice(1)} photo={(i) => photo(i + 1)} title="Um pouco do nosso dia" />
      <section className="st-cta"><div className="st-wrap"><h2>Vamos conversar?</h2>{wa && <a className="st-btn inv" href={wa}>{c.hero.cta}</a>}</div></section>
      <Reviews c={c} /><Faq c={c} /><Location c={c} /><Footer c={c} />
    </div>
  );
}
