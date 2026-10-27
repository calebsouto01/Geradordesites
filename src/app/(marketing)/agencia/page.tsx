import type { Metadata } from "next";
import { BRAND, contactHref, isPlaceholder } from "@/lib/marketing/brand";
import { B, Cards, Cta, Faq, Footer, Header, Section, Steps } from "@/components/marketing/Mk";

export const metadata: Metadata = {
  title: `${BRAND.company} · Página para o seu negócio ser encontrado no Google`,
  description: "Eu monto a página do seu negócio com as informações que já estão na internet e apresento antes de você decidir. Valor único, sem mensalidade.",
};

export default function Agencia() {
  const talk = contactHref("Olá! Quero agendar a apresentação gratuita da página do meu negócio.");
  const jsonLd = !isPlaceholder(BRAND.company) ? {
    "@context": "https://schema.org", "@type": "ProfessionalService", name: BRAND.company,
    ...(BRAND.cnpj && !isPlaceholder(BRAND.cnpj) ? { taxID: BRAND.cnpj } : {}),
    ...(BRAND.city && !isPlaceholder(BRAND.city) ? { areaServed: BRAND.city } : {}),
    ...(BRAND.whatsapp ? { telephone: `+${BRAND.whatsapp}` } : {}), email: BRAND.email,
  } : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <Header site="agencia" />
      <main>
        <section className="mk-hero">
          <div className="mk-wrap">
            <h1>Quem pesquisa o seu negócio no Google precisa achar tudo em um só lugar.</h1>
            <p>Eu monto a página do seu negócio com as informações que já estão na internet e apresento pronta, antes de você decidir qualquer coisa. Valor único, sem mensalidade.</p>
            <div className="mk-btns">
              <a className="mk-btn" href={talk}>Agendar apresentação gratuita</a>
              <a className="mk-btn ghost" href="#como-funciona">Ver como funciona</a>
            </div>
            <p className="mk-note">Sem compromisso: você vê a página pronta e só então decide.</p>
          </div>
        </section>

        <Section title="O cliente que nunca chegou" intro="Quem pesquisa e não encontra um negócio rápido nem chega a conhecê-lo. Não é que escolheu outro lugar: não teve a chance de saber que ele existe, e o dono nunca fica sabendo quem foi.">
          <Cards items={[
            { title: "Horário e localização", text: "A pessoa quer saber se está aberto e como chegar, sem precisar chamar para descobrir." },
            { title: "Serviços e avaliações", text: "O que você faz e o que os clientes dizem, em uma página só, no momento em que a pessoa decide." },
            { title: "Um toque para falar com você", text: "WhatsApp, ligação e como chegar, direto da página. Quem chama já chega sabendo o básico." },
          ]} />
        </Section>

        <Section id="como-funciona" alt title="Como funciona" intro="Você não paga nada para ver a página pronta.">
          <Steps items={[
            { title: "Eu pesquiso o seu negócio", text: "Reúno as informações que já estão na internet (horário, serviços, avaliações, localização) e monto a página." },
            { title: "Apresentação gratuita", text: "Marcamos uma reunião e eu mostro a página pronta, explicando cada parte. Você vê como ficaria antes de decidir." },
            { title: "Se gostar, fechamos", text: "Valor único, sem mensalidade, com parcelamento em até 2x. A página vai ao ar e você fica com ela." },
          ]} />
        </Section>

        <Section title="O que você recebe">
          <div className="mk-two">
            <ul className="mk-list">
              <li>Página do seu negócio com horário, serviços, localização e avaliações reais</li>
              <li>Botões de WhatsApp, ligar e como chegar</li>
              <li>Endereço próprio na internet (o domínio é renovado uma vez por ano)</li>
              <li>Ajustes quando você precisar, com valor combinado antes</li>
              <li>A página é sua: pode ficar hospedada comigo ou onde você preferir</li>
            </ul>
            <div className="mk-card">
              <h3>Valor único, sem mensalidade</h3>
              <p>Você paga uma vez pelo trabalho. O valor exato eu apresento na reunião, junto com a página, para você ver o que está contratando.</p>
            </div>
          </div>
        </Section>

        <Section id="quem-sou-eu" alt title="Quem sou eu">
          <div className="mk-person">
            <div className="mk-photo">sua foto</div>
            <div>
              <h3><B v={BRAND.owner} /> · <B v={BRAND.company} /></h3>
              <p style={{ marginTop: 8 }}>Trabalho com negócios locais de <B v={BRAND.city} />. <mark className="ph">[CONTE EM DUAS FRASES QUEM VOCÊ É E HÁ QUANTO TEMPO TRABALHA COM ISSO]</mark></p>
              <p style={{ marginTop: 8 }}>CNPJ <B v={BRAND.cnpj} /> · <B v={BRAND.address} />, <B v={BRAND.city} /></p>
              {BRAND.instagram && <p style={{ marginTop: 8 }}><a href={`https://instagram.com/${BRAND.instagram}`}>@{BRAND.instagram}</a></p>}
            </div>
          </div>
        </Section>

        <Section title="Páginas que já entreguei" intro="Exemplos reais, publicados com a autorização de cada cliente.">
          <Cards items={[
            { title: "[NOME DO CLIENTE 1]", text: "[Ramo e cidade. Link da página.]" },
            { title: "[NOME DO CLIENTE 2]", text: "[Ramo e cidade. Link da página.]" },
            { title: "[NOME DO CLIENTE 3]", text: "[Ramo e cidade. Link da página.]" },
          ]} />
        </Section>

        <Section id="perguntas" alt title="Perguntas frequentes">
          <Faq items={[
            { q: "Preciso pagar alguma coisa para ver a página?", a: "Não. A apresentação é gratuita. Você vê a página pronta e só depois decide." },
            { q: "Quanto custa?", a: "Valor único, sem mensalidade. O valor exato eu apresento na reunião, junto com a página." },
            { q: "De onde vêm as informações e as fotos?", a: "As informações vêm de fontes públicas, como o Google. Na versão final eu uso as fotos que você me enviar, porque elas são suas e mostram o seu negócio como ele é." },
            { q: "Como funciona o domínio?", a: "O endereço da página (como suaempresa.com.br) funciona como o aluguel de uma placa: fica em nome do seu negócio e é renovado uma vez por ano. Isso vale para qualquer site, de qualquer profissional." },
            { q: "E se eu precisar mudar alguma coisa depois?", a: "Eu faço os ajustes. O valor é combinado antes, então não tem surpresa." },
            { q: "A página é minha mesmo?", a: "Sim. Ela pode ficar hospedada comigo ou, se você preferir, em outro lugar. Combinamos isso na entrega." },
          ]} />
        </Section>

        <Cta title="Vamos conversar?" text="Marque a apresentação gratuita. Eu mostro a página do seu negócio pronta, em poucos minutos." href={talk} label="Agendar apresentação gratuita" />
      </main>
      <Footer site="agencia" />
    </>
  );
}
