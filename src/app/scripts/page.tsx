"use client";
import { useState } from "react";

type NodeId =
  | "abertura" | "no_time" | "diagnostico" | "valor" | "planos"
  | "duvida_dominio" | "obj_preco" | "obj_mensal" | "obj_pensar" | "interesse"
  | "fechamento" | "ganhou" | "perdido";

type Opt = { label: string; to: NodeId };
type Node = { badge: string; title: string; script: React.ReactNode; tip?: string; next: Opt[] };

const NODES: Record<NodeId, Node> = {
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
  no_time: {
    badge: "Reagendar",
    title: "Não é um bom momento",
    script: <p>“Sem problema! Que horário fica melhor pra eu te ligar de novo — hoje mais tarde ou amanhã?”</p>,
    tip: "Nunca desligue sem sair com um horário marcado. Anote e volte exatamente nesse horário.",
    next: [],
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
    badge: "Fechamento · passo 5",
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

const ORDER: NodeId[] = [
  "abertura", "no_time", "diagnostico", "valor", "planos",
  "duvida_dominio", "obj_preco", "obj_mensal", "obj_pensar", "interesse",
  "fechamento", "ganhou", "perdido",
];

function NodeCard({ id, extra = "", onPick }: { id: NodeId; extra?: string; onPick: (id: NodeId) => void }) {
  const n = NODES[id];
  return (
    <button className={`panel callmap-node ${extra}`} onClick={() => onPick(id)}>
      <span className="callmap-badge">{n.badge}</span>
      <span className="callmap-title">{n.title}</span>
    </button>
  );
}

export default function Scripts() {
  const [path, setPath] = useState<NodeId[]>(["abertura"]);
  const current = path[path.length - 1];
  const n = NODES[current];

  function goTo(id: NodeId) {
    const i = path.indexOf(id);
    setPath(i !== -1 ? path.slice(0, i + 1) : [...path, id]);
  }

  function jump(id: NodeId) {
    const i = path.indexOf(id);
    setPath(i !== -1 ? path.slice(0, i + 1) : [id]);
  }

  const stateFor = (id: NodeId, kind?: "good" | "bad" | "end") => {
    if (id === current) return "on";
    if (path.includes(id)) return "done";
    return kind ?? "";
  };

  return (
    <>
      <div className="pagehead">
        <h1>Scripts de ligação</h1>
        <span className="mut">Clique nas respostas do cliente — o mapa marca o caminho percorrido e te guia de volta ao fechamento.</span>
      </div>

      <div className="callmap-chips">
        {ORDER.map((id) => (
          <button key={id} className={`callmap-chip ${id === current ? "on" : path.includes(id) ? "done" : ""}`} onClick={() => jump(id)}>
            {NODES[id].title}
          </button>
        ))}
      </div>

      <div className="callmap-flow">
        <div className="callmap-row"><NodeCard id="abertura" extra={stateFor("abertura")} onPick={goTo} /></div>
        <div className="callmap-hint">↓ conforme a resposta</div>
        <div className="callmap-branch">
          <div className="callmap-col"><div className={`callmap-stem ${path.includes("diagnostico") || path.includes("no_time") ? "on" : ""}`} /><NodeCard id="diagnostico" extra={stateFor("diagnostico")} onPick={goTo} /></div>
          <div className="callmap-col"><div className={`callmap-stem ${path.includes("no_time") ? "on" : ""}`} /><NodeCard id="no_time" extra={stateFor("no_time", "end")} onPick={goTo} /></div>
        </div>

        <div className={`callmap-stem ${path.includes("valor") ? "on" : ""}`} />
        <div className="callmap-row"><NodeCard id="valor" extra={stateFor("valor")} onPick={goTo} /></div>
        <div className={`callmap-stem ${path.includes("planos") ? "on" : ""}`} />
        <div className="callmap-row"><NodeCard id="planos" extra={stateFor("planos")} onPick={goTo} /></div>

        <div className="callmap-hint">↓ conforme a resposta do cliente</div>
        <div className="callmap-branch">
          {(["obj_preco", "obj_mensal", "duvida_dominio", "obj_pensar", "interesse"] as NodeId[]).map((id) => (
            <div className="callmap-col" key={id}>
              <div className={`callmap-stem ${path.includes(id) ? "on" : ""}`} />
              <NodeCard id={id} extra={stateFor(id)} onPick={goTo} />
            </div>
          ))}
        </div>
        <div className="callmap-hint">↓ qualquer caminho leva ao fechamento</div>
        <div className={`callmap-stem ${path.includes("fechamento") ? "on" : ""}`} />

        <div className="callmap-row"><NodeCard id="fechamento" extra={stateFor("fechamento")} onPick={goTo} /></div>
        <div className="callmap-hint">↓ resultado</div>
        <div className="callmap-branch">
          <div className="callmap-col"><div className={`callmap-stem ${path.includes("ganhou") ? "on" : ""}`} /><NodeCard id="ganhou" extra={stateFor("ganhou", "good")} onPick={goTo} /></div>
          <div className="callmap-col"><div className={`callmap-stem ${path.includes("perdido") ? "on" : ""}`} /><NodeCard id="perdido" extra={stateFor("perdido", "bad")} onPick={goTo} /></div>
        </div>
      </div>

      <div className="panel callmap-detail">
        <span className="callmap-badge">{n.badge}</span>
        <h2 style={{ fontSize: 17, margin: "4px 0 14px" }}>{n.title}</h2>
        <div className="script">{n.script}</div>
        {n.tip && <div className="callmap-tip"><b>dica →</b><span>{n.tip}</span></div>}
        {n.next.length > 0 && (
          <div className="callmap-opts">
            {n.next.map((o) => (
              <button key={o.to} className="callmap-opt" onClick={() => goTo(o.to)}>
                <span>{o.label}</span><span>→</span>
              </button>
            ))}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <button className="ghost sm" onClick={() => setPath(["abertura"])}>↺ reiniciar</button>
        </div>
      </div>
    </>
  );
}
