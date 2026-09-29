import { Acc, Footer, Nav, Rating, stars, waLink, type Ctx } from "../shared";

// Moderno: tecnológico. Título animado palavra a palavra, faixa em movimento, cartões que inclinam e brilham.
export default function Moderno({ c, photo }: Ctx) {
  const wa = waLink(c), b = c.business, ph = c.photos ?? [];
  const words = c.hero.headline.split(" ");
  const marquee = [...c.services.items.map((s) => s.title), b.category || b.name].filter(Boolean);
  return (
    <div className="lay-moderno">
      <div className="mo-progress" data-progress aria-hidden />
      <Nav c={c} />
      <header className="mo-hero" data-spot style={ph.length ? { backgroundImage: `linear-gradient(180deg,rgba(8,10,16,.6),rgba(8,10,16,.94)),url(${photo(0)})` } : undefined}>
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

      <section className="st-sec">
        <div className="st-wrap">
          <div className="mo-head" data-rv><span>01</span><h2>Sobre</h2></div>
          <p className="st-lead" data-rv>{c.about.text}</p>
          <div className="mo-head" data-rv style={{ marginTop: 56 }}><span>02</span><h2>{c.services.title}</h2></div>
          <div className="mo-cards">
            {c.services.items.map((s, i) => (
              <div key={i} className="mo-card tilt" data-rv><small>{String(i + 1).padStart(2, "0")}</small><h3>{s.title}</h3><p>{s.text}</p></div>
            ))}
          </div>
        </div>
      </section>

      {ph.length > 1 && (
        <section className="st-sec alt">
          <div className="st-wrap">
            <div className="mo-head" data-rv><span>03</span><h2>No dia a dia</h2></div>
            <div className="mo-masonry">
              {ph.slice(1).map((_, i) => <div key={i} className="mo-tile" data-rv><img src={photo(i + 1)} data-full={photo(i + 1)} alt={`Foto ${i + 1}`} loading="lazy" /></div>)}
            </div>
          </div>
        </section>
      )}

      {c.reviews.items.length > 0 && (
        <section className="st-sec">
          <div className="st-wrap">
            <div className="mo-head" data-rv><span>04</span><h2>{c.reviews.title}</h2></div>
            <div className="mo-rev">
              {c.reviews.items.map((r, i) => (
                <figure key={i} className="mo-glass" data-rv><div className="st-stars">{stars(r.rating)}</div><blockquote>“{r.text}”</blockquote><figcaption>{r.author} · Google</figcaption></figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {c.faq && c.faq.length > 0 && (
        <section className="st-sec alt">
          <div className="st-wrap st-narrow"><div className="mo-head" data-rv><span>05</span><h2>Perguntas frequentes</h2></div><Acc c={c} /></div>
        </section>
      )}

      <section className="st-sec">
        <div className="st-wrap st-two">
          <div data-rv>
            <div className="mo-head"><span>06</span><h2>Onde estamos</h2></div>
            <p className="mo-addr">{b.address || "Endereço em breve."}</p>
            {b.phone && <p><b>Telefone:</b> {b.phone}</p>}
            <a className="st-btn" href={b.mapsUrl} data-mag>Abrir no mapa</a>
          </div>
          {c.hours.length > 0 && <div data-rv><h2>Horários</h2><ul className="st-hours">{c.hours.map((h, i) => <li key={i}>{h}</li>)}</ul></div>}
        </div>
      </section>
      <Footer c={c} />
    </div>
  );
}
