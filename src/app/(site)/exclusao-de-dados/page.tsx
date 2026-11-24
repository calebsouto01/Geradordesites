import type { Metadata } from "next";
import { COMPANY, CONTACT_EMAIL, LEGAL_DATE } from "@/lib/legal";

export const metadata: Metadata = { title: "Exclusão de dados" };

export default function ExclusaoDeDados() {
  return (
    <main className="legal">
      <h1>Exclusão de dados</h1>
      <p className="meta">Versão de {LEGAL_DATE}</p>
      <h2>Se você é usuário do painel</h2>
      <ul>
        <li><b>Desconectar o WhatsApp:</b> em Agentes de IA, abra o agente, clique em WhatsApp e depois em Desconectar. O token de acesso é apagado.</li>
        <li><b>Apagar um agente:</b> em Agentes de IA, clique no ícone de lixeira do agente. O agente, a conexão e todo o histórico de mensagens dele são excluídos.</li>
        <li><b>Apagar a conta inteira:</b> escreva para <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> pelo e-mail cadastrado. Excluímos a conta e os dados associados em até 30 dias.</li>
      </ul>
      <h2>Se você conversou com o atendimento de uma empresa pelo WhatsApp</h2>
      <p>As mensagens ficam guardadas para a empresa que usa o {COMPANY}. Para pedir a exclusão das suas mensagens e do seu número de telefone, escreva para <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> informando o número de telefone usado no WhatsApp e, se souber, o nome da empresa. Também encaminhamos o pedido à empresa responsável. Respondemos e concluímos a exclusão em até 30 dias.</p>
      <h2>O que pode ser mantido</h2>
      <p>Dados que a lei obriga a guardar, como registros fiscais de cobrança, podem ser mantidos pelo prazo legal.</p>
    </main>
  );
}
