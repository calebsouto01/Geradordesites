"use client";
import { useEffect, useRef, useState } from "react";
import { KEYS, SCRIPTS, type Kind, type ScriptKey } from "@/lib/scripts/data";

// Árvore de negociação: o usuário clica nas respostas do cliente e o mapa marca o caminho.
export default function CallTree({ onChange }: { onChange?: (s: { key: ScriptKey; path: string[] }) => void }) {
  const [key, setKey] = useState<ScriptKey>(1);
  const S = SCRIPTS[key];
  const [path, setPath] = useState<string[]>([S.start]);
  const current = path[path.length - 1];
  const n = S.nodes[current];

  const tree = useRef<HTMLDivElement>(null);

  useEffect(() => { onChange?.({ key, path }); }, [key, path]); // eslint-disable-line react-hooks/exhaustive-deps

  // A árvore rola sozinha até a posição atual, para o usuário sempre ver onde está.
  useEffect(() => {
    const box = tree.current;
    const el = box?.querySelector<HTMLElement>(`[data-node="${current}"]`);
    if (!box || !el) return;
    const b = box.getBoundingClientRect(); const e = el.getBoundingClientRect();
    box.scrollTo({ top: box.scrollTop + (e.top - b.top) - (b.height - e.height) / 2, behavior: "smooth" });
  }, [current, key]);

  function choose(k: ScriptKey) { setKey(k); setPath([SCRIPTS[k].start]); }
  function goTo(id: string) {
    const i = path.indexOf(id);
    setPath(i !== -1 ? path.slice(0, i + 1) : [...path, id]);
  }
  const stateFor = (id: string, kind?: Kind) => (id === current ? "on" : path.includes(id) ? "done" : kind ?? "");
  const card = (id: string, kind?: Kind) => {
    const node = S.nodes[id];
    return (
      <button data-node={id} className={`panel callmap-node ${stateFor(id, kind)}`} onClick={() => goTo(id)}>
        <span className="callmap-badge">{node.badge}</span>
        <span className="callmap-title">{node.title}</span>
      </button>
    );
  };

  return (
    <>
      <div className="callmap-tabs" role="tablist" aria-label="Modelo de script">
        <span className="mut" style={{ alignSelf: "center" }}>Modelo:</span>
        {KEYS.map((k) => (
          <button key={k} role="tab" aria-selected={k === key} className={`callmap-tab ${k === key ? "on" : ""}`} onClick={() => choose(k)}>
            <b>{SCRIPTS[k].label}</b>
            <span>{SCRIPTS[k].sub}</span>
          </button>
        ))}
      </div>

      <div className="callmap-layout">
        <div className="callmap-tree" ref={tree}>
          <div className="callmap-colhead">Árvore</div>
          <div className="callmap-flow">
            {S.flow.map((item, i) => {
              if (item.t === "hint") return <div key={i} className="callmap-hint">{item.text}</div>;
              if (item.t === "node") {
                return (
                  <div key={i} style={{ display: "contents" }}>
                    {!item.first && <div className={`callmap-stem ${path.includes(item.id) ? "on" : ""}`} />}
                    <div className="callmap-row">{card(item.id)}</div>
                  </div>
                );
              }
              return (
                <div key={i} className="callmap-branch">
                  {item.items.map(({ id, kind }) => (
                    <div className="callmap-col" key={id}>
                      <div className={`callmap-stem ${path.includes(id) ? "on" : ""}`} />
                      {card(id, kind)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel callmap-detail">
          <div className="callmap-colhead">O que falar</div>
          <span className="callmap-badge">{n.badge}</span>
          <h2 style={{ fontSize: 17, margin: "4px 0 14px" }}>{n.title}</h2>
          <div className="script">{n.script}</div>
          {n.tip && <div className="callmap-tip"><b>dica →</b><span>{n.tip}</span></div>}
        </div>

        <div className="panel callmap-answers">
          <div className="callmap-colhead">Resposta do cliente</div>
          {n.next.length > 0 ? (
            <div className="callmap-opts">
              {n.next.map((o) => (
                <button key={o.to} className="callmap-opt" onClick={() => goTo(o.to)}>
                  <span>{o.label}</span><span>→</span>
                </button>
              ))}
            </div>
          ) : <p className="mut" style={{ margin: "8px 0 0" }}>Fim deste caminho. Registre o resultado da ligação ou reinicie para tentar outro caminho.</p>}
          <div style={{ marginTop: 16 }}>
            <button className="ghost sm" onClick={() => setPath([S.start])}>↺ reiniciar</button>
          </div>
        </div>
      </div>
    </>
  );
}
