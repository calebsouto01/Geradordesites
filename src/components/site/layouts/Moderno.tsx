import { Faq, Footer, Gallery, Location, Nav, Rating, Reviews, waLink, type Ctx } from "../shared";

export default function Moderno({ c, photo }: Ctx) {
  const wa = waLink(c), b = c.business, hero = (c.photos ?? []).length ? photo(0) : null;
  return (
    <div className="lay-moderno">
      <Nav c={c} />
      <header className="st-hero" style={hero ? { backgroundImage: `linear-gradient(180deg,rgba(8,10,16,.55),rgba(8,10,16,.92)),url(${hero})` } : undefined}>
        <div className="st-wrap">
          <span className="st-tag">{b.category || "Negócio local"}</span>
          <h1>{c.hero.headline}</h1>
          <p>{c.hero.subheadline}</p>
          <div className="st-actions">
            {wa && <a className="st-btn" href={wa}>{c.hero.cta}</a>}
            <a className="st-btn ghost" href={b.mapsUrl}>Como chegar</a>
          </div>
          <Rating c={c} />
        </div>
      </header>
      <section className="st-sec">
        <div className="st-wrap">
          <h2 className="rv">{c.about.title}</h2>
          <p className="st-lead rv">{c.about.text}</p>
          <div className="st-num">
            {c.services.items.map((s, i) => (
              <div key={i} className="rv"><span>{String(i + 1).padStart(2, "0")}</span><h3>{s.title}</h3><p>{s.text}</p></div>
            ))}
          </div>
        </div>
      </section>
      <Gallery photos={(c.photos ?? []).slice(1)} photo={(i) => photo(i + 1)} title="No dia a dia" />
      <Reviews c={c} /><Faq c={c} /><Location c={c} /><Footer c={c} />
    </div>
  );
}
