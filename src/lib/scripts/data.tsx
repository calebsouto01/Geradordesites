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


/* ---------- Script 4: pergunta de descoberta (abertura verdadeira, baseada na pesquisa) ---------- */
const SEGUIR_ENVIO = [{ label: "Seguir → marcar a reunião", to: "envio4" }];
export const NODES_4: Record<string, Node> = {
  ...SHARED,
  // Nas objeções comuns, o próximo passo é enviar a prévia (e não escolher plano antes de ver).
  obj_pensar: {
    ...SHARED.obj_pensar,
    script: <p>“Sem problema, é uma decisão importante. Na reunião você já pode trazer o sócio ou quem decide junto com você, e eu apresento para os dois de uma vez. Qual o melhor dia e horário para vocês?”</p>,
    tip: "Quem decide junto entra na reunião. Assim a decisão sai de uma vez e o dono não precisa explicar sozinho.",
    next: SEGUIR_ENVIO,
  },
  duvida_dominio: { ...SHARED.duvida_dominio, next: SEGUIR_ENVIO },
  obj_preco: { ...SHARED.obj_preco, next: SEGUIR_ENVIO },
  abertura4: {
    badge: "Abertura · passo 1",
    title: "Confirmar o proprietário",
    script: <p>“Oi, [nome do contato]? Aqui é [seu nome]. Encontrei o contato da [negócio] no Google. Eu falo com o proprietário?”</p>,
    tip: "Pergunta de porta de entrada: confirma quem decide antes de qualquer explicação. Termine na pergunta e espere a resposta.",
    next: [
      { label: "“Sim, sou eu / sou o proprietário”", to: "pesquisa4" },
      { label: "“Não”", to: "atendente4" },
    ],
  },
  atendente4: {
    badge: "Atendente · chegar ao proprietário",
    title: "Não é o proprietário",
    script: <p>“Tudo bem! Com quem eu falo? O proprietário está? Se não estiver, qual o melhor horário para eu encontrá-lo? É sobre como a [negócio] aparece no Google.”</p>,
    tip: "Seja breve, anote o nome de quem atendeu e o horário. Não explique o produto para quem não decide.",
    next: [
      { label: "Passou para o proprietário", to: "pesquisa4" },
      { label: "Proprietário não está", to: "no_time" },
    ],
  },
  pesquisa4: {
    badge: "Pesquisa · passo 2",
    title: "Pesquisa + pergunta de descoberta",
    script: (
      <>
        <p>“Eu trabalho com negócios locais e, na minha pesquisa por [categoria] em [cidade], a empresa de vocês apareceu com nota [nota] e [nº] avaliações. Só que não achei um site com [horários / valores / serviços].”</p>
        <p>“Vocês têm um site que eu não encontrei, ou ainda não têm?”</p>
      </>
    ),
    tip: "Só diga o que é verdade: o contato, a nota e a pesquisa vêm do Google. Termine na pergunta e espere a resposta, sem preencher o silêncio.",
    next: [
      { label: "“Ainda não temos”", to: "historia4" },
      { label: "“Temos, sim”", to: "tem_site4" },
      { label: "“Quem é você?”", to: "quem_e4" },
      { label: "“Só tenho Instagram / WhatsApp”", to: "insta4" },
      { label: "“Não é um bom momento”", to: "no_time" },
    ],
  },
  historia4: {
    badge: "Escuta · passo 3",
    title: "Já pensaram em ter um?",
    script: <p>“Entendi. E vocês já chegaram a pensar em ter um site, ou até a cotar com alguém?”</p>,
    tip: "Ouça a história sem interromper. Ela revela a objeção real: preço, confiança ou falta de tempo.",
    next: [
      { label: "Cotou antes (caro ou o profissional sumiu)", to: "experiencia4" },
      { label: "Nunca pensou / não é prioridade", to: "revelacao4" },
    ],
  },
  tem_site4: {
    badge: "Dúvida comum",
    title: "“Temos, sim”",
    script: <p>“Que bom que vocês têm! Então vale eu te contar um detalhe: no perfil de vocês no Google, o campo de site está vazio, e foi por isso que eu não encontrei. Quem pesquisa [categoria] em [cidade] e não acha vocês rápido nem chega a conhecer vocês. Nem é que escolheu outro lugar: ela nem teve a chance de saber que vocês existem, e vocês nunca ficam sabendo quem foi. Como as pessoas chegam no site de vocês hoje?”</p>,
    tip: "Só diga o que é verdade: o campo de site vazio no Google é verificável. Não invente número. Se o site é bom, só avise do perfil do Google e encerre bem.",
    next: [
      { label: "É bom, só não estava no Google", to: "encerrar4" },
      { label: "É antigo / não abre no celular / está desatualizado", to: "revelacao4" },
      { label: "Na verdade é só rede social", to: "insta4" },
    ],
  },
  encerrar4: {
    badge: "Encerrar",
    title: "Já tem página boa: ajudar e encerrar",
    script: <p>“Perfeito, então o ajuste é simples: coloque o endereço do site no campo ‘site’ do perfil de vocês no Google, e quem pesquisar chega até ele. Obrigado pelo seu tempo e desculpa o incômodo!”</p>,
    tip: "Encerrar ajudando gera boa imagem e indicação. Registre o resultado e siga para o próximo contato.",
    next: [],
  },
  quem_e4: {
    badge: "Dúvida comum",
    title: "“Quem é você?”",
    script: <p>“Eu crio sites para negócios locais e estou falando com empresas bem avaliadas da região que ainda não têm um. A [negócio] chamou atenção na minha pesquisa. Me tira uma curiosidade: vocês já chegaram a pensar em ter um site?”</p>,
    tip: "Responda em poucas palavras, com a verdade, e termine na pergunta. Nunca deixe a resposta terminar em afirmação: o silêncio trava a ligação.",
    next: [
      { label: "Já cotou antes (caro ou o profissional sumiu)", to: "experiencia4" },
      { label: "Nunca pensou / não é prioridade", to: "revelacao4" },
    ],
  },
  insta4: {
    badge: "Contorno de objeção",
    title: "“Só tenho Instagram / WhatsApp”",
    script: <p>“O Instagram é ótimo para quem já conhece vocês. Mas quem pesquisa [categoria] em [cidade] no Google quer achar horário, valores e onde fica sem precisar chamar. Hoje essa pessoa encontra isso onde?”</p>,
    tip: "Não desvalorize o Instagram. Deixe o dono perceber sozinho que quem pesquisa no Google precisa chamar para saber o básico.",
    next: [
      { label: "“Chama no WhatsApp” / não encontra", to: "revelacao4" },
      { label: "Cotou antes (caro ou o profissional sumiu)", to: "experiencia4" },
      { label: "“O Instagram já basta”", to: "insta_basta4" },
    ],
  },
  insta_basta4: {
    badge: "Contorno de objeção",
    title: "“O Instagram já basta”",
    script: <p>“Para quem já segue vocês, basta mesmo. Mas quem pesquisa [categoria] em [cidade] no Google e não acha vocês nem chega a conhecer vocês, e vocês nunca ficam sabendo quem foi. Vocês já pararam para pensar em quantas pessoas pesquisam e nunca chegam até vocês?”</p>,
    tip: "Fale da chance que a pessoa nem teve, não de concorrente. Não invente número: a pergunta faz o dono pensar no tamanho do que não vê.",
    next: [
      { label: "Nunca tinha pensado / quer entender", to: "revelacao4" },
      { label: "Cotou antes (caro ou o profissional sumiu)", to: "experiencia4" },
    ],
  },
  experiencia4: {
    badge: "Contorno de objeção",
    title: "Experiência ruim ou orçamento caro",
    script: <p>“Imagino, isso acontece bastante. Por isso eu faço diferente: primeiro eu monto a página com o que já está público no Google, e você só decide depois de ver pronta. Assim não tem risco de eu sumir, porque o trabalho já está feito. É gratuito. Podemos marcar uma reunião para eu te apresentar o que montei?”</p>,
    tip: "Reconheça a história dele antes de apresentar o seu jeito. A prévia pronta é a prova. Termine sempre com a pergunta.",
    next: [{ label: "Seguir → revelação da prévia", to: "revelacao4" }],
  },
  revelacao4: {
    badge: "Revelação · passo 4",
    title: "“Eu já montei uma página para vocês”",
    script: (
      <>
        <p>“Eu já montei uma página para vocês, com as informações que recolhi na internet. A ideia é poupar o tempo de vocês com as perguntas de horário, serviços e localização que imagino que chegam todo dia no WhatsApp. Quem chamar já chega sabendo o básico.”</p>
        <p>“É gratuito e rápido. Podemos marcar uma reunião para eu te apresentar?”</p>
      </>
    ),
    tip: "Seja claro de que a página foi feita a partir de informações públicas. Não envie antes: a página é apresentada na reunião, com você explicando.",
    next: [
      { label: "Aceita a reunião", to: "envio4" },
      { label: "“Quanto custa?”", to: "preco4" },
      { label: "“E se eu precisar alterar?”", to: "alterar4" },
      { label: "“Vou pensar / falar com sócio”", to: "obj_pensar" },
      { label: "“Como funciona o domínio?”", to: "duvida_dominio" },
    ],
  },
  preco4: {
    badge: "Dúvida comum",
    title: "“Quanto custa?”",
    script: <p>“O modelo é valor único, sem mensalidade, e dá para parcelar em até 2x. Na reunião eu te apresento a página e o valor exato, e se você gostar, a gente já fecha. Podemos marcar?”</p>,
    tip: "“Valor único, sem mensalidade” é a fala que leva o cliente aberto para fechar. Fale o modelo logo e deixe o número para a reunião; se ele insistir, dê o valor sem rodeio.",
    next: [
      { label: "Aceita a reunião", to: "envio4" },
      { label: "Insiste no valor", to: "planos4" },
    ],
  },
  planos4: {
    badge: "Oferta",
    title: "Dar o valor",
    script: (
      <>
        <p>“O Plano Base é [valor único], com a página no ar e o domínio do primeiro ano. A renovação do domínio é [valor]/ano. Parcelo em até [2]x.”</p>
        <p>“A página é sua, por tempo indeterminado: pode ficar hospedada comigo ou você leva os arquivos e hospeda onde preferir. Podemos marcar a reunião para eu te apresentar a página?”</p>
      </>
    ),
    tip: "Só prometa o que o sistema entrega hoje. Domínio e hospedagem têm custo recorrente, e a analogia do aluguel da placa explica isso.",
    next: [
      { label: "Aceita a reunião", to: "envio4" },
      { label: "“Está caro”", to: "obj_preco" },
    ],
  },
  alterar4: {
    badge: "Dúvida comum",
    title: "“E se eu precisar alterar?”",
    script: <p>“Consigo, sim. Se ficar hospedada comigo, eu ajusto no mesmo dia [valor simbólico / incluso]. Se você hospedar por conta própria, eu faço a alteração avulsa por [valor]. Podemos marcar a reunião para eu te apresentar a página?”</p>,
    tip: "Tenha o valor de alteração definido antes da ligação. Isso mostra segurança.",
    next: [{ label: "Seguir → marcar a reunião", to: "envio4" }],
  },
  envio4: {
    badge: "Reunião · passo 5",
    title: "Marcar a reunião de apresentação",
    script: <p>“Perfeito! Qual o melhor dia e horário para você? Pode ser por videochamada ou, se preferir, pessoalmente. E qual o melhor WhatsApp para eu confirmar?”</p>,
    tip: "Feche dia e hora concretos (duas opções ajudam: “terça ou quarta?”) e confirme por WhatsApp na hora.",
    next: [{ label: "Reunião marcada", to: "retorno4" }],
  },
  retorno4: {
    badge: "Resultado",
    title: "Reunião marcada",
    script: <p>Confirme agora pelo WhatsApp (aba “Por WhatsApp”), registre <b>“Pediu retorno”</b> com a data da reunião em <b>Encerrar contato</b> e prepare a apresentação: a prévia da página (criada com <b>Criar site</b>) e, quando disponível, o PDF de apresentação.</p>,
    tip: "Mande um lembrete na véspera. Quem chega à reunião já sabe que é valor único e sem mensalidade, e vem aberto a fechar.",
    next: [],
  },
};

const FLOW_4: FlowItem[] = [
  { t: "node", id: "abertura4", first: true },
  { t: "hint", text: "↓ é o proprietário?" },
  { t: "branch", items: [{ id: "pesquisa4" }, { id: "atendente4" }] },
  { t: "hint", text: "↓ conforme a resposta" },
  { t: "branch", items: [{ id: "historia4" }, { id: "tem_site4" }, { id: "quem_e4" }, { id: "insta4" }, { id: "no_time", kind: "end" }] },
  { t: "hint", text: "↓ se já cotou ou teve experiência ruim" },
  { t: "branch", items: [{ id: "experiencia4" }, { id: "insta_basta4" }, { id: "encerrar4", kind: "end" }] },
  { t: "hint", text: "↓ revelação da prévia" },
  { t: "node", id: "revelacao4" },
  { t: "hint", text: "↓ dúvidas comuns antes de enviar" },
  { t: "branch", items: [{ id: "preco4" }, { id: "alterar4" }, { id: "obj_pensar" }, { id: "duvida_dominio" }] },
  { t: "node", id: "planos4" },
  { t: "hint", text: "↓ marcar a reunião de apresentação" },
  { t: "node", id: "envio4" },
  { t: "node", id: "retorno4" },
];

export const SCRIPTS = {
  4: { label: "Script", sub: "Pergunta de descoberta", nodes: NODES_4, flow: FLOW_4, start: "abertura4" },
} as const;
export type ScriptKey = keyof typeof SCRIPTS;
export const KEYS: ScriptKey[] = [4];

