import type { Metadata } from "next";
import { COMPANY, CONTACT_EMAIL, LEGAL_DATE } from "@/lib/legal";

export const metadata: Metadata = { title: "Termos de uso" };

export default function Termos() {
  return (
    <main className="legal">
      <h1>Termos de uso</h1>
      <p className="meta">Versão de {LEGAL_DATE}</p>
      <h2>1. O serviço</h2>
      <p>{COMPANY} permite encontrar negócios locais sem site, criar prévias e sites para eles e acompanhar o contato comercial em um funil de vendas. O serviço é oferecido a quem vende esses sites (o “usuário”).</p>
      <h2>2. Conta e plano</h2>
      <p>Para usar, o usuário cria uma conta com e-mail e senha e é responsável por manter a senha em segurança. O Plano Inicial custa R$ 49,90 por mês e inclui 45 créditos mensais. Cada busca custa 3 créditos e cada site gerado custa 3 créditos. Novas contas recebem 6 créditos de teste. Créditos não usados no mês não acumulam. A assinatura pode ser cancelada a qualquer momento pelo portal de cobrança, valendo até o fim do período já pago.</p>
      <h2>3. Uso permitido</h2>
      <p>É proibido usar o serviço para enganar pessoas ou empresas, criar sites que se passem por outra organização, coletar dados sem base legal, enviar conteúdo ilegal, ofensivo ou que viole direitos de terceiros. O usuário declara ter o direito de usar o logo, as fotos e os textos que enviar e é o responsável por eles.</p>
      <h2>4. Prévias e publicação</h2>
      <p>A prévia é um rascunho para apresentar a proposta ao negócio: tem marca d’água, não é indexada por buscadores e expira em 7 dias. Prévias não devem ser divulgadas como se o negócio as tivesse contratado. O site só deve ser publicado com a concordância do negócio.</p>
      <h2>5. Dados do Google e de terceiros</h2>
      <p>Informações como avaliações, horários e fotos podem vir do Google e são exibidas conforme os termos do Google, podendo mudar ou deixar de estar disponíveis. Não garantimos que esses dados estejam completos ou atualizados.</p>
      <h2>6. Texto gerado por IA</h2>
      <p>Parte do texto é escrita por inteligência artificial a partir dos dados informados. O usuário deve revisar o conteúdo antes de apresentar ou publicar e responde por ele.</p>
      <h2>7. Denúncias e remoção</h2>
      <p>Qualquer pessoa pode denunciar um site pelo link “Denunciar este site”. Podemos bloquear ou remover sites e contas que violem estes termos, sem aviso prévio em casos graves.</p>
      <h2>8. Limitação de responsabilidade</h2>
      <p>O serviço é oferecido “como está”. Não garantimos resultados de vendas nem disponibilidade ininterrupta. Na medida permitida em lei, nossa responsabilidade se limita ao valor pago nos últimos 3 meses.</p>
      <h2>9. Alterações e contato</h2>
      <p>Podemos atualizar estes termos e avisaremos por e-mail ou no painel. Dúvidas: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </main>
  );
}
