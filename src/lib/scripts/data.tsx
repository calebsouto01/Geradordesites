// Dados da árvore de negociação (roteiros de ligação). Usados em /scripts e no painel do funil.
export type Opt = { label: string; to: string };
export type Node = { badge: string; title: string; script: React.ReactNode; tip?: string; next: Opt[] };
export type Kind = "good" | "bad" | "end";
export type FlowItem =
  | { t: "node"; id: string; first?: boolean }
  | { t: "hint"; text: string }
  | { t: "branch"; items: { id: string; kind?: Kind }[] };

/* ---------- etapas compartilhadas pelos dois scripts ---------- */
export const SHARED: Record<string, Node> = {
  no_time: {
    badge: "Reagendar",
    title: "Não é um bom momento",
    script: <p>“Sem problema! Que horário fica melhor pra eu te ligar de novo — hoje mais tarde ou amanhã?”</p>,
    tip: "Nunca desligue sem sair com um horário marcado. Anote e volte exatamente nesse horário.",
    next: [],
  },
  duvida_dominio: {
    badge: "Dúvida comum",
    title: "“Como funciona o domínio?”",
    script: (
      <>
        <p>“O nome do site (tipo `suaempresa.com.br`) funciona como um aluguel de placa — fica em nome de vocês, mas precisa ser renovado todo ano pra continuar ativo. Isso vale pra qualquer site, feito por qualquer agência, não é algo específico do que eu faço.”</p>
        <p>“O site em si não tem prazo nenhum, fica de vocês pra sempre — o que tem prazo é só esse aluguel do nome. Se por algum motivo não renovar a tempo, o site continua no ar num endereço padrão, só o nome personalizado é que para de funcionar.”</p>
      </>
    ),
    tip: "Cliente leigo não sabe o que é domínio — nunca use esse termo sozinho, sempre com a analogia.",
    next: [{ label: "Seguir → fechamento", to: "fechamento" }],
  },
  obj_preco: {
    badge: "Contorno de objeção",
    title: "“Está caro”",
    script: <p>“Entendo. Mas pensa assim: esse valor é menor do que [X aulas avulsas / um mês de impulsionamento] — e o site continua trabalhando pra você todos os dias, sem parar. Quantos clientes novos por mês já pagariam esse investimento de volta?”</p>,
    tip: "Deixe o cliente fazer a conta em voz alta — quando ele mesmo calcula o retorno, a objeção perde força.",
    next: [{ label: "Seguir → fechamento", to: "fechamento" }],
  },
  obj_mensal: {
    badge: "Contorno de objeção",
    title: "“Vou pagar todo mês?”",
    script: (
      <ol>
        <li>Isso não é uma taxa por existir — é manutenção, atualização e garantia de que o site fica sempre no ar e atualizado.</li>
        <li>Sem isso, qualquer ajuste vira um orçamento avulso toda vez que precisar mexer.</li>
        <li>É menos que [uma aula avulsa / um post impulsionado] por mês.</li>
        <li>Sem fidelidade longa — cancela quando quiser.</li>
        <li>Sem manutenção ativa, em poucos meses o site fica desatualizado — e isso passa a imagem contrária à que você quer.</li>
      </ol>
    ),
    tip: "Não deixe a conversa parar na objeção — volte sempre pra pergunta de fechamento logo depois.",
    next: [{ label: "Seguir → fechamento", to: "fechamento" }],
  },
  obj_pensar: {
    badge: "Contorno de objeção",
    title: "“Vou pensar / falar com sócio”",
    script: <p>“Sem problema, é uma decisão importante. Só pra eu entender — tirando o valor, ficou alguma dúvida sobre o que o site faz? Posso te mandar o link agora pra você mostrar pra ele(a), e já vemos um horário essa semana pra fechar juntos?”</p>,
    tip: "O objetivo não é fechar na hora — é sair da ligação com uma data marcada.",
    next: [{ label: "Seguir → fechamento", to: "fechamento" }],
  },
  interesse: {
    badge: "Via direta",
    title: "“Bora fechar”",
    script: <p>“Perfeito! Então bora confirmar os detalhes e já colocar em andamento.”</p>,
    tip: "Quando o cliente já demonstra decisão, não insista em vender mais — vá direto pro fechamento.",
    next: [{ label: "Seguir → fechamento", to: "fechamento" }],
  },
  fechamento: {
    badge: "Fechamento",
    title: "Pergunta de fechamento",
    script: <p>“Baseado no que conversamos, qual plano faz mais sentido pra vocês: o Completo ou o Base? Já consigo começar essa semana e entrego pronto em [prazo combinado].”</p>,
    tip: "Pergunta sempre no formato de escolha assumida, nunca “você quer fechar?” — isso reduz a chance de um não seco.",
    next: [
      { label: "Cliente topou", to: "ganhou" },
      { label: "Ainda não", to: "perdido" },
    ],
  },
  ganhou: {
    badge: "Resultado",
    title: "Fechou! Próximos passos",
    script: (
      <ul>
        <li>Confirmar forma de pagamento e data de início.</li>
        <li>Pedir ao cliente fotos e informações reais pra substituir os placeholders.</li>
        <li>Marcar data de entrega e um check-in pós-entrega.</li>
      </ul>
    ),
    next: [],
  },
  perdido: {
    badge: "Resultado",
    title: "Não fechou agora — não perder o lead",
    script: (
      <ul>
        <li>Nunca deixar em aberto sem próximo passo — marcar data e hora concreta de retorno.</li>
        <li>Mandar um resumo por WhatsApp com o link do site e os planos discutidos.</li>
        <li>Anotar qual foi a objeção real pra ajustar a abordagem no retorno.</li>
      </ul>
    ),
    next: [],
  },
};

/* ---------- Script 1: abordagem clássica (pedido de permissão) ---------- */
export const NODES_1: Record<string, Node> = {
  ...SHARED,
  abertura: {
    badge: "Abertura fria · passo 1",
    title: "Pedido de permissão",
    script: <p>“Oi, boa tarde! Aqui é o Kaleb. Vi a [nome do negócio] aqui perto e queria fazer um contato rápido — posso roubar 2 minutinhos, ou prefere que eu ligue em outro momento?”</p>,
    tip: "Pedir permissão reduz a resistência automática de quem recebe uma ligação sem esperar. Não pule essa etapa em público frio.",
    next: [
      { label: "Cliente topou conversar", to: "diagnostico" },
      { label: "“Não é um bom momento”", to: "no_time" },
    ],
  },
  diagnostico: {
    badge: "Diagnóstico · passo 2",
    title: "Antes do pitch",
    script: <p>“Legal! Eu crio sites pra negócios locais, e queria te fazer uma pergunta rápida: hoje, quando alguém quer saber horário, plano ou onde fica o local, como essa pessoa descobre isso? É tudo pelo WhatsApp ou Instagram?”</p>,
    tip: "Não avance sem ouvir a resposta — é ela que alimenta a próxima fala.",
    next: [{ label: "Cliente respondeu → seguir", to: "valor" }],
  },
  valor: {
    badge: "Valor · passo 3",
    title: "O que o site resolve",
    script: (
      <>
        <p>“É exatamente isso que o site resolve. Ele vira um vendedor disponível 24 horas, sem custo de folha — toda essa dúvida de horário e localização a pessoa resolve sozinha, direto na página.”</p>
        <ul>
          <li>Primeira impressão profissional — quem pesquisa no Google confia mais num site bem feito do que só um perfil de rede social.</li>
          <li>Reduz atrito na conversão — a pessoa já chega decidida, sem 5 trocas de mensagem.</li>
          <li>Vira diferencial — a maioria dos concorrentes locais só tem Instagram, não site.</li>
        </ul>
      </>
    ),
    tip: "Deixe o cliente reagir aqui antes de falar de preço.",
    next: [{ label: "Seguir → apresentar planos", to: "planos" }],
  },
  planos: {
    badge: "Oferta · passo 4",
    title: "Apresentar os planos",
    script: (
      <>
        <p><b>Plano Completo</b> — R$1.200 na criação + R$147/mês (inclui domínio + alterações sempre que precisar). Ideal pra quem mexe no site com frequência (promoção, horário, novidade sazonal).</p>
        <p><b>Plano Base</b> — R$827 já com o site e o domínio do primeiro ano inclusos, sem separar valores. Renovação do domínio: R$90/ano. Alteração avulsa, quando precisar: R$97.</p>
      </>
    ),
    tip: "Se o cliente perguntar sobre o domínio, use a analogia do aluguel de placa — sem isso ele não entende por que precisa renovar.",
    next: [
      { label: "“Tá caro”", to: "obj_preco" },
      { label: "“Pago todo mês?”", to: "obj_mensal" },
      { label: "“Como funciona o domínio?”", to: "duvida_dominio" },
      { label: "“Vou pensar”", to: "obj_pensar" },
      { label: "“Bora fechar”", to: "interesse" },
    ],
  },
};

const FLOW_1: FlowItem[] = [
  { t: "node", id: "abertura", first: true },
  { t: "hint", text: "↓ conforme a resposta" },
  { t: "branch", items: [{ id: "diagnostico" }, { id: "no_time", kind: "end" }] },
  { t: "node", id: "valor" },
  { t: "node", id: "planos" },
  { t: "hint", text: "↓ conforme a resposta do cliente" },
  { t: "branch", items: ["obj_preco", "obj_mensal", "duvida_dominio", "obj_pensar", "interesse"].map((id) => ({ id })) },
  { t: "hint", text: "↓ qualquer caminho leva ao fechamento" },
  { t: "node", id: "fechamento" },
  { t: "hint", text: "↓ resultado" },
  { t: "branch", items: [{ id: "ganhou", kind: "good" }, { id: "perdido", kind: "bad" }] },
];

/* ---------- Script 2: abertura com motivo + prévia grátis ---------- */
export const NODES_2: Record<string, Node> = {
  ...SHARED,
  abertura2: {
    badge: "Abertura com motivo · passo 1",
    title: "Motivo + dado real do negócio",
    script: (
      <>
        <p>“Oi, [nome do contato]? Aqui é [seu nome], da [sua empresa]. Vou direto ao ponto: pesquisando [categoria] em [cidade], vi que a [negócio] tem nota [nota] no Google, com [nº] avaliações — uma reputação que poucos têm na região.”</p>
        <p>“Só que, quando alguém clica pra saber mais, não encontra um site com horário, preço e fotos, e esse cliente acaba indo pro concorrente que tem. Preparei uma prévia de como o site de vocês ficaria e queria te mandar. Pode ser pelo WhatsApp?”</p>
      </>
    ),
    tip: "Sem “tudo bem?” e sem pedir permissão: a ligação começa com um dado real e um motivo. Preencha nota e avaliações com os dados do lead na Busca.",
    next: [
      { label: "Aceitou receber a prévia", to: "oferta" },
      { label: "“Quem é você?”", to: "quem_e" },
      { label: "“Já tenho Instagram”", to: "obj_instagram" },
      { label: "“Não é um bom momento”", to: "no_time" },
    ],
  },
  quem_e: {
    badge: "Dúvida comum",
    title: "“Quem é você?”",
    script: <p>“Eu crio sites pra negócios locais. Vi que a [negócio] tem uma ótima avaliação e ainda não tem site, então montei uma prévia por conta própria pra mostrar como ficaria. Posso te mandar?”</p>,
    tip: "Responda em uma frase e volte para a oferta da prévia.",
    next: [{ label: "Seguir → oferta da prévia", to: "oferta" }],
  },
  obj_instagram: {
    badge: "Contorno de objeção",
    title: "“Já tenho Instagram”",
    script: <p>“O Instagram é ótimo pra quem já conhece vocês. Mas quem pesquisa no Google [categoria] em [cidade] procura horário, preço e localização, e nem sempre abre rede social pra isso. O site pega esse cliente que hoje vai pro concorrente. Deixa eu te mostrar a prévia, sem compromisso?”</p>,
    tip: "Não desvalorize o Instagram: posicione o site como complemento que captura quem busca no Google.",
    next: [{ label: "Seguir → oferta da prévia", to: "oferta" }],
  },
  oferta: {
    badge: "Oferta · passo 2",
    title: "Prévia gratuita",
    script: <p>“É uma página só, com o nome de vocês, as fotos que já estão no Google, horário e botão de WhatsApp. Não tem custo e não tem compromisso: se gostarem, a gente conversa; se não, fica de cortesia. Qual o melhor WhatsApp pra eu enviar?”</p>,
    tip: "Envie com marca d'água de “prévia” e limite a uma página, para a cortesia não virar site de graça.",
    next: [{ label: "Prévia enviada → retorno", to: "reacao" }],
  },
  reacao: {
    badge: "Retorno · passo 3",
    title: "Reação à prévia",
    script: <p>“Conseguiu ver? O que achou de ver a [negócio] assim, com o site no ar?”</p>,
    tip: "Ligue ou chame 10 a 15 minutos depois do envio. Deixe o cliente falar: a reação dele mostra se o interesse é real.",
    next: [
      { label: "Gostou → entender o cenário", to: "diagnostico2" },
      { label: "“Quanto custa?”", to: "planos2" },
    ],
  },
  diagnostico2: {
    badge: "Diagnóstico · passo 4",
    title: "Onde o cliente se perde hoje",
    script: <p>“Hoje, quando alguém quer saber horário, preço ou onde fica, como essa pessoa descobre? É tudo por Instagram e WhatsApp? Quantas mensagens até ela se decidir?”</p>,
    tip: "Depois da prévia, a pergunta serve para o cliente perceber a perda, não para você descobrir o que ele já sente.",
    next: [{ label: "Cliente respondeu → valor", to: "valor2" }],
  },
  valor2: {
    badge: "Valor · passo 5",
    title: "O que o site resolve",
    script: <p>“O site vira um vendedor que trabalha 24 horas: a pessoa tira a dúvida sozinha e quem chega no seu WhatsApp já vem decidido. É o que você acabou de ver na prévia, só que no ar.”</p>,
    tip: "Curto e ligado ao que ele já viu. Não repita o pitch inteiro.",
    next: [{ label: "Seguir → planos", to: "planos2" }],
  },
  planos2: {
    badge: "Oferta · passo 6",
    title: "Apresentar os planos",
    script: (
      <>
        <p><b>Plano Completo</b> — [valor de criação] + [mensalidade]/mês, com domínio e alterações sempre que precisar.</p>
        <p><b>Plano Base</b> — [valor único], com site e domínio do primeiro ano. Renovação do domínio: [valor]/ano. Alteração avulsa: [valor].</p>
      </>
    ),
    tip: "Substitua os colchetes pelos seus valores. Se perguntarem do domínio, use a analogia do aluguel de placa.",
    next: [
      { label: "“Tá caro”", to: "obj_preco" },
      { label: "“Pago todo mês?”", to: "obj_mensal" },
      { label: "“Como funciona o domínio?”", to: "duvida_dominio" },
      { label: "“Vou pensar”", to: "obj_pensar" },
      { label: "“Bora fechar”", to: "interesse" },
    ],
  },
};

const FLOW_2: FlowItem[] = [
  { t: "node", id: "abertura2", first: true },
  { t: "hint", text: "↓ conforme a resposta" },
  { t: "branch", items: [{ id: "oferta" }, { id: "quem_e" }, { id: "obj_instagram" }, { id: "no_time", kind: "end" }] },
  { t: "node", id: "reacao" },
  { t: "node", id: "diagnostico2" },
  { t: "node", id: "valor2" },
  { t: "node", id: "planos2" },
  { t: "hint", text: "↓ conforme a resposta do cliente" },
  { t: "branch", items: ["obj_preco", "obj_mensal", "duvida_dominio", "obj_pensar", "interesse"].map((id) => ({ id })) },
  { t: "hint", text: "↓ qualquer caminho leva ao fechamento" },
  { t: "node", id: "fechamento" },
  { t: "hint", text: "↓ resultado" },
  { t: "branch", items: [{ id: "ganhou", kind: "good" }, { id: "perdido", kind: "bad" }] },
];

export const SCRIPTS = {
  1: { label: "Opção 1", sub: "Pedido de permissão", nodes: NODES_1, flow: FLOW_1, start: "abertura" },
  2: { label: "Opção 2", sub: "Motivo + prévia grátis", nodes: NODES_2, flow: FLOW_2, start: "abertura2" },
} as const;
export type ScriptKey = keyof typeof SCRIPTS;
export const KEYS: ScriptKey[] = [1, 2];

