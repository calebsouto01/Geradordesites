import type { SiteContent } from "@/lib/site/types";

const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

export default function SiteRender({ c, preview, expiresAt }: { c: SiteContent; preview: boolean; expiresAt?: string | null }) {
  const b = c.business;
  const wa = b.whatsapp ? `https://wa.me/${b.whatsapp}?text=${encodeURIComponent(`Olá! Vi o site da ${b.name} e gostaria de mais informações.`)}` : "";
  return (
    <div className="st" style={{ ["--accent" as string]: c.theme.accent }}>
      {preview && (
        <div className="st-banner">
          Prévia gratuita — este site ainda não foi publicado
          {expiresAt ? ` · disponível até ${new Date(expiresAt).toLocaleDateString("pt-BR")}` : ""}
        </div>
      )}
      {preview && <div className="st-mark" aria-hidden>PRÉVIA</div>}

      <header className="st-hero">
        <div className="st-wrap">
          <span className="st-tag">{b.category || "Negócio local"}</span>
          <h1>{c.hero.headline}</h1>
          <p>{c.hero.subheadline}</p>
          <div className="st-actions">
            {wa && <a className="st-btn" href={wa}>{c.hero.cta}</a>}
            <a className="st-btn ghost" href={b.mapsUrl}>Como chegar</a>
          </div>
          {b.rating && (
            <div className="st-rating"><span>{stars(b.rating)}</span> <b>{b.rating}</b> no Google{b.ratingCount ? ` · ${b.ratingCount} avaliações` : ""}</div>
          )}
        </div>
      </header>

      <section className="st-sec">
        <div className="st-wrap">
          <h2>{c.about.title}</h2>
          <p className="st-lead">{c.about.text}</p>
        </div>
      </section>

      <section className="st-sec alt">
        <div className="st-wrap">
          <h2>{c.services.title}</h2>
          <div className="st-grid">
            {c.services.items.map((s, i) => (
              <div key={i} className="st-card"><h3>{s.title}</h3><p>{s.text}</p></div>
            ))}
          </div>
        </div>
      </section>

      {c.reviews.items.length > 0 && (
        <section className="st-sec">
          <div className="st-wrap">
            <h2>{c.reviews.title}</h2>
            <div className="st-grid">
              {c.reviews.items.map((r, i) => (
                <figure key={i} className="st-card">
                  <div className="st-stars">{stars(r.rating)}</div>
                  <blockquote>“{r.text}”</blockquote>
                  <figcaption>{r.author} · avaliação no Google</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="st-sec alt">
        <div className="st-wrap st-two">
          <div>
            <h2>Onde estamos</h2>
            <p className="st-lead">{b.address || "Endereço em breve."}</p>
            {b.phone && <p><b>Telefone:</b> {b.phone}</p>}
            <a className="st-btn" href={b.mapsUrl}>Abrir no mapa</a>
          </div>
          {c.hours.length > 0 && (
            <div>
              <h2>Horários</h2>
              <ul className="st-hours">{c.hours.map((h, i) => <li key={i}>{h}</li>)}</ul>
            </div>
          )}
        </div>
      </section>

      <footer className="st-foot">© {new Date().getFullYear()} {b.name}</footer>
      {wa && <a className="st-float" href={wa} aria-label="WhatsApp">WhatsApp</a>}
    </div>
  );
}
