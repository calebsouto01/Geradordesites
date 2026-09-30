import type { Metadata } from "next";
import { COMPANY, CONTACT_EMAIL, LEGAL_DATE } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function Privacidade() {
  return (
    <main className="legal">
      <h1>Política de privacidade</h1>
      <p className="meta">Versão de {LEGAL_DATE} · em conformidade com a Lei Geral de Proteção de Dados (LGPD)</p>
      <h2>1. Quem somos</h2>
      <p>{COMPANY} é o controlador dos dados do usuário do painel. Contato do encarregado: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      <h2>2. Dados que tratamos</h2>
      <ul>
        <li><b>Conta:</b> e-mail e senha (guardada de forma criptografada).</li>
        <li><b>Uso:</b> buscas, leads, sites criados, créditos consumidos e endereço IP para limite de uso e segurança.</li>
        <li><b>Conteúdo enviado:</b> logos, fotos e textos que o usuário envia.</li>
        <li><b>Dados de negócios:</b> nome, endereço, telefone, avaliações e horários públicos obtidos do Google.</li>
        <li><b>Sites publicados:</b> visualizações, cliques e mensagens enviadas pelo formulário do site por visitantes (nome, telefone e mensagem).</li>
        <li><b>Pagamento:</b> tratado pelo Stripe; não armazenamos dados de cartão.</li>
      </ul>
      <h2>3. Para que usamos</h2>
      <p>Prestar o serviço, cobrar o plano, evitar abuso e fraude, dar suporte e melhorar o produto. As bases legais são a execução de contrato, o legítimo interesse e o cumprimento de obrigação legal.</p>
      <h2>4. Com quem compartilhamos</h2>
      <p>Usamos operadores para funcionar: Supabase (banco e arquivos), Vercel (hospedagem), Google (dados de negócios e mapas), Anthropic (geração de texto por IA, com os dados do negócio e do briefing) e Stripe (pagamentos). Não vendemos dados.</p>
      <h2>5. Por quanto tempo</h2>
      <p>Mantemos os dados enquanto a conta existir. Prévias expiradas deixam de ser exibidas. Ao excluir a conta, apagamos ou anonimizamos os dados, salvo os que a lei exige guardar.</p>
      <h2>6. Seus direitos</h2>
      <p>Você pode pedir acesso, correção, exclusão, portabilidade e informações sobre o tratamento, e revogar consentimentos, escrevendo para <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Responderemos em prazo razoável.</p>
      <h2>7. Negócios e visitantes</h2>
      <p>Se você é dono de um negócio e não quer a prévia ou o site com seus dados, use o link “Denunciar este site” ou escreva para o contato acima e removeremos.</p>
    </main>
  );
}
