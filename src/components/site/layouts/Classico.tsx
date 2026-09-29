import { Acc, Footer, Heading, Nav, Rating, renderSections, stars, waLink, type Ctx } from "../shared";

// Clássico: elegante e sóbrio. Confiança primeiro: sobre, diferenciais, serviços, equipe, depoimentos.
export default function Classico({ c, photo }: Ctx) {
  const wa = waLink(c), b = c.business, ph = c.photos ?? [];
  const L = "classico" as const;
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

      {renderSections(c, L, {
        sobre: () => (
          <section className="st-sec"><div className="st-wrap st-two">
            <div><Heading layout={L} eyebrow="Sobre nós">{c.about.title}</Heading><p className="st-lead" data-rv>{c.about.text}</p></div>
            {ph.length > 1 && <img className="st-side" data-rv src={photo(1)} alt={b.name} loading="lazy" data-full={photo(1)} />}
          </div></section>
        ),
        servicos: () => (
          <section className="st-sec"><div className="st-wrap">
            <Heading layout={L} eyebrow="O que fazemos">{c.services.title}</Heading>
            <div className="st-grid">{c.services.items.map((s, i) => <div key={i} className="st-card cl-card" data-rv><span className="cl-num">{i + 1}</span><h3>{s.title}</h3><p>{s.text}</p></div>)}</div>
          </div></section>
        ),
        galeria: () => (
          <section className="st-sec"><div className="st-wrap">
            <Heading layout={L} eyebrow="Galeria">Conheça o espaço</Heading>
            <div className="st-gal">{ph.slice(1).map((_, i) => <img key={i} data-rv src={photo(i + 1)} data-full={photo(i + 1)} alt={`Foto ${i + 1}`} loading="lazy" />)}</div>
          </div></section>
        ),
        depoimentos: () => (
          <section className="st-sec alt"><div className="st-wrap st-narrow">
            <Heading layout={L} eyebrow="Depoimentos">{c.reviews.title}</Heading>
            {c.reviews.items.map((r, i) => (
              <figure key={i} className="cl-quote" data-rv><blockquote>{r.text}</blockquote><figcaption><span className="st-stars">{stars(r.rating)}</span> {r.author} · avaliação no Google</figcaption></figure>
            ))}
          </div></section>
        ),
        faq: () => <section className="st-sec"><div className="st-wrap st-narrow"><Heading layout={L} eyebrow="Dúvidas">Perguntas frequentes</Heading><Acc c={c} /></div></section>,
      })}
      <Footer c={c} />
    </div>
  );
}
