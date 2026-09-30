import { Acc, Footer, Heading, Nav, Rating, renderSections, stars, waLink, type Ctx } from "../shared";

// Moderno: tecnológico. Impacto primeiro: números, serviços, passo a passo e planos.
export default function Moderno({ c, photo, slug }: Ctx) {
  const wa = waLink(c), b = c.business, ph = c.photos ?? [];
  const off = c.media?.hero ? 0 : 1;
  const heroImg = c.media?.hero ?? (ph.length ? photo(0) : null);
  const L = "moderno" as const;
  const words = c.hero.headline.split(" ");
  const marquee = [...c.services.items.map((s) => s.title), b.category || b.name].filter(Boolean);
  return (
    <div className="lay-moderno">
      <div className="mo-progress" data-progress aria-hidden />
      <Nav c={c} />
      <header className="mo-hero" data-spot style={heroImg ? { backgroundImage: `linear-gradient(180deg,rgba(8,10,16,.6),rgba(8,10,16,.94)),url(${heroImg})` } : undefined}>
        <div className="mo-glow" aria-hidden />
        <div className="st-wrap">
          <span className="st-tag">{b.category || "Negócio local"}</span>
          <h1>{words.map((w, i) => <span key={i} className="mo-w" style={{ ["--i" as string]: i }}>{w}&nbsp;</span>)}</h1>
          <p className="mo-sub">{c.hero.subheadline}</p>
          <div className="st-actions">
            {wa && <a className="st-btn" href={wa} data-mag>{c.hero.cta}</a>}
            <a className="st-btn ghost" href={b.mapsUrl} data-mag>Como chegar</a>
          </div>
          <Rating c={c} />
        </div>
      </header>
      <div className="mo-marq" aria-hidden><div className="mo-track">{[...marquee, ...marquee, ...marquee, ...marquee].map((m, i) => <span key={i}>{m} <em>✦</em></span>)}</div></div>

      {renderSections(c, L, {
        sobre: () => <section className="st-sec"><div className="st-wrap st-two"><div><Heading layout={L}>Sobre</Heading><p className="st-lead" data-rv>{c.about.text}</p></div>{c.media?.sobre && <img className="st-side mo-side" data-rv src={c.media.sobre} data-full={c.media.sobre} alt={b.name} loading="lazy" />}</div></section>,
        servicos: () => (
          <section className="st-sec alt"><div className="st-wrap">
            <Heading layout={L}>{c.services.title}</Heading>
            <div className="mo-cards">{c.services.items.map((s, i) => <div key={i} className="mo-card tilt" data-rv><small>{String(i + 1).padStart(2, "0")}</small><h3>{s.title}</h3><p>{s.text}</p></div>)}</div>
          </div></section>
        ),
        galeria: () => (
          <section className="st-sec"><div className="st-wrap">
            <Heading layout={L}>No dia a dia</Heading>
            <div className="mo-masonry">{ph.slice(off).map((_, i) => <div key={i} className="mo-tile" data-rv><img src={photo(i + off)} data-full={photo(i + off)} alt={`Foto ${i + 1}`} loading="lazy" /></div>)}</div>
          </div></section>
        ),
        depoimentos: () => (
          <section className="st-sec alt"><div className="st-wrap">
            <Heading layout={L}>{c.reviews.title}</Heading>
            <div className="mo-rev">{c.reviews.items.map((r, i) => <figure key={i} className="mo-glass" data-rv><div className="st-stars">{stars(r.rating)}</div><blockquote>“{r.text}”</blockquote><figcaption>{r.author} · Google</figcaption></figure>)}</div>
          </div></section>
        ),
        faq: () => <section className="st-sec"><div className="st-wrap st-narrow"><Heading layout={L}>Perguntas frequentes</Heading><Acc c={c} /></div></section>,
      })}
      <Footer c={c} slug={slug} />
    </div>
  );
}
