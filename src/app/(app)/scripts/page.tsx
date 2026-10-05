import CallTree from "@/components/CallTree";

export default function Scripts() {
  return (
    <>
      <div className="pagehead">
        <h1>Scripts de ligação</h1>
        <span className="mut">Escolha um script e clique nas respostas do cliente — o mapa marca o caminho percorrido e te guia até o fechamento.</span>
      </div>
      <CallTree />
    </>
  );
}
