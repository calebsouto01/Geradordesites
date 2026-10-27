import type { Metadata } from "next";
import { BRAND } from "@/lib/marketing/brand";
import { Cards, Cta, Faq, Footer, Header, Section, Steps } from "@/components/marketing/Mk";

export const metadata: Metadata = {
  title: `${BRAND.product} · Ache clientes sem site, converse com o roteiro certo e feche a venda`,
  description: "Plataforma para quem vende sites a negócios locais: busca de comércios bem avaliados sem site, funil de vendas, árvore de negociação e página pronta em um clique.",
};

export default function Plataforma() {
  const p = BRAND.plan;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "SoftwareApplication", name: BRAND.product, applicationCategory: "BusinessApplication", operatingSystem: "Web",
    offers: { "@type": "Offer", price: "49.90", priceCurrency: "BRL" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header site="plataforma" />
      <main>
        <section className="mk-hero">
          <div className="mk-wrap">
            <h1>Ache o cliente. Converse com o roteiro certo. Feche a venda.</h1>
            <p>{BRAND.product} reúne a busca de negócios bem avaliados que ainda não têm site, o funil de vendas, a árvore de negociação e a página pronta em um clique. Você não precisa saber criar site: precisa saber vender.</p>
            <div className="mk-btns">
              <a className="mk-btn" href="/login?cadastro=1">Criar conta e testar grátis</a>
              <a className="mk-btn ghost" href="#fluxo">Ver como funciona</a>
            </div>
            <p className="mk-note">{p.trial} créditos de teste ao criar a conta. Sem cartão para começar.</p>
          </div>
        </section>

        <Section id="fluxo" title="Do primeiro contato ao fechamento, em um lugar só">
          <Steps items={[
            { title: "Achar", text: "Busque por cidade e categoria. O sistema mostra negócios bem avaliados no Google que ainda não têm site, com foto, nota e telefone." },
            { title: "Conversar", text: "O funil e a árvore de negociação guiam a ligação, o WhatsApp e o retorno, com falas prontas e respostas às objeções." },
            { title: "Mostrar", text: "Gere em um clique a página do negócio, com as informações dele, e apresente ao dono. Envie o link ou o PDF." },
            { title: "Fechar", text: "Com a venda confirmada, publique a página e registre o resultado. O painel do operador mostra o que está funcionando." },
          ]} />
        </Section>

        <Section alt title="A árvore de negociação" intro="O que diferencia o sistema: você não improvisa a conversa. A árvore mostra o que falar em cada resposta do cliente.">
          <Cards items={[
            { title: "Pedido de permissão", text: "Abertura clássica para quem prefere pedir licença antes de falar." },
            { title: "Motivo + prévia pronta", text: "Abertura com um dado real do negócio e a página já montada." },
            { title: "Retorno de ligação", text: "Retoma a conversa de onde parou, com o caminho para cada objeção." },
            { title: "Pergunta de descoberta", text: "A abertura que faz o dono perceber sozinho o que está deixando de ganhar, e leva à reunião de apresentação." },
          ]} />
        </Section>

        <Section title="A página pronta em um clique" intro="Escolha o negócio e o sistema monta a página com o modelo certo para o ramo, as informações do Google e os depoimentos reais.">
          <div className="mk-two">
            <ul className="mk-list">
              <li>Três modelos visuais, cada um com seus efeitos</li>
              <li>Prévia com link para enviar ao cliente</li>
              <li>PDF de apresentação para a reunião <small>(em breve)</small></li>
              <li>Texto premium opcional, mais elaborado</li>
              <li>Publicação com domínio próprio quando a venda fecha</li>
            </ul>
            <ul className="mk-list">
              <li>Funil de vendas com uma ação por etapa</li>
              <li>Mensagens personalizadas por negócio (opcional)</li>
              <li>Histórico de ligações e painel do operador</li>
              <li>Exportação do site em arquivos <small>(em breve)</small></li>
            </ul>
          </div>
        </Section>

        <Section id="preco" alt title="Um plano, simples" intro="Os créditos pagam a busca e a criação das páginas. Sem fidelidade: cancele quando quiser.">
          <div className="mk-price">
            <div className="v">{p.price}<small> /mês</small></div>
            <p style={{ marginTop: 10 }}>{p.credits} créditos por mês · {p.trial} de teste ao criar a conta</p>
            <ul className="mk-list" style={{ marginTop: 16 }}>
              <li>Busca: {p.search} créditos</li>
              <li>Página do negócio: {p.site} créditos</li>
              <li>Texto premium: +{p.premium} créditos</li>
              <li>Mensagens personalizadas por negócio: {p.messages} crédito</li>
            </ul>
            <div className="mk-btns"><a className="mk-btn" href="/login?cadastro=1">Criar conta e testar</a></div>
          </div>
        </Section>

        <Section title="Em breve: a academia" intro="Aulas para quem está começando a vender sites: como abordar o dono, como apresentar a página, como cobrar e como entregar.">
          <span className="mk-soon">Em breve</span>
        </Section>

        <Section id="perguntas" alt title="Perguntas frequentes">
          <Faq items={[
            { q: "Preciso saber criar sites?", a: "Não. O sistema monta a página do negócio e você foca em conversar e vender." },
            { q: "De onde vêm os dados dos negócios?", a: "Da pesquisa no Google: nome, endereço, telefone, nota, avaliações e horário. As fotos do Google aparecem na prévia; na entrega final, o ideal é usar as fotos enviadas pelo próprio cliente." },
            { q: "Posso hospedar os sites em outro lugar?", a: "A ideia é permitir a exportação dos arquivos do site para hospedar onde você quiser. Esse recurso está em desenvolvimento." },
            { q: "Como funciona o cancelamento?", a: "A assinatura pode ser cancelada a qualquer momento e vale até o fim do período já pago." },
            { q: "Quanto tempo leva para criar uma página?", a: "Poucos segundos para gerar a prévia. Você ajusta o que quiser no editor antes de apresentar." },
          ]} />
        </Section>

        <Cta title="Comece pela primeira busca" text={`Crie a conta, use os ${p.trial} créditos de teste e veja a primeira página pronta.`} href="/login?cadastro=1" label="Criar conta e testar grátis" />
      </main>
      <Footer site="plataforma" />
    </>
  );
}
