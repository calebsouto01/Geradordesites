import Link from "next/link";
import { BRAND, isPlaceholder } from "@/lib/marketing/brand";

// Texto de marca: se ainda for marcador, aparece destacado para não passar despercebido.
export function B({ v }: { v: string }) {
  return isPlaceholder(v) ? <mark className="ph">{v}</mark> : <>{v}</>;
}

export function Header({ site }: { site: "agencia" | "plataforma" }) {
  return (
    <header className="mk-head">
      <div className="mk-wrap mk-headin">
        <Link href={site === "agencia" ? "/agencia" : "/plataforma"} className="mk-logo">{site === "agencia" ? <B v={BRAND.company} /> : BRAND.product}</Link>
        <nav className="mk-nav" aria-label="Principal">
          {site === "agencia" ? (
            <>
              <a href="#como-funciona">Como funciona</a><a href="#quem-sou-eu">Quem sou eu</a><a href="#perguntas">Perguntas</a>
              <Link href="/plataforma" className="mk-ghost">Plataforma</Link>
            </>
          ) : (
            <>
              <a href="#fluxo">Como funciona</a><a href="#preco">Preço</a><a href="#perguntas">Perguntas</a>
              <Link href="/login" className="mk-ghost">Entrar</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer({ site }: { site: "agencia" | "plataforma" }) {
  return (
    <footer className="mk-foot">
      <div className="mk-wrap mk-footin">
        <div>
          <b>{site === "agencia" ? <B v={BRAND.company} /> : BRAND.product}</b>
          <p>
            {site === "agencia"
              ? <>CNPJ <B v={BRAND.cnpj} /> · <B v={BRAND.address} />, <B v={BRAND.city} /></>
              : <>Plataforma para quem vende sites a negócios locais.</>}
          </p>
          <p><a href={`mailto:${BRAND.email}`}>{BRAND.email}</a></p>
        </div>
        <div className="mk-footlinks">
          <Link href="/termos">Termos de uso</Link>
          <Link href="/privacidade">Política de privacidade</Link>
          {site === "agencia" ? <Link href="/plataforma">Conheça a plataforma que usamos: {BRAND.product}</Link> : <Link href="/agencia">Serviço direto ao negócio: <B v={BRAND.company} /></Link>}
        </div>
      </div>
    </footer>
  );
}

export function Section({ id, title, intro, children, alt }: { id?: string; title: string; intro?: string; children: React.ReactNode; alt?: boolean }) {
  return (
    <section id={id} className={`mk-sec ${alt ? "alt" : ""}`}>
      <div className="mk-wrap">
        <h2>{title}</h2>
        {intro && <p className="mk-intro">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="mk-steps">
      {items.map((s, i) => (
        <li key={s.title}><span className="n">{i + 1}</span><div><h3>{s.title}</h3><p>{s.text}</p></div></li>
      ))}
    </ol>
  );
}

export function Cards({ items }: { items: { title: string; text: string }[] }) {
  return (
    <div className="mk-cards">
      {items.map((c) => <div key={c.title} className="mk-card"><h3>{c.title}</h3><p>{c.text}</p></div>)}
    </div>
  );
}

export function Faq({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  return (
    <div className="mk-faq">
      {items.map((f) => <details key={f.q}><summary>{f.q}</summary><div>{f.a}</div></details>)}
    </div>
  );
}

export function Cta({ title, text, href, label, secondary }: { title: string; text: string; href: string; label: string; secondary?: { href: string; label: string } }) {
  return (
    <section className="mk-cta">
      <div className="mk-wrap">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="mk-btns">
          <a className="mk-btn" href={href}>{label}</a>
          {secondary && <a className="mk-btn ghost" href={secondary.href}>{secondary.label}</a>}
        </div>
      </div>
    </section>
  );
}
