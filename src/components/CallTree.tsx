"use client";
import { useEffect, useState } from "react";
import { KEYS, SCRIPTS, type Kind, type ScriptKey } from "@/lib/scripts/data";

// Árvore de negociação: o usuário clica nas respostas do cliente e o mapa marca o caminho.
export default function CallTree({ onChange }: { onChange?: (s: { key: ScriptKey; path: string[] }) => void }) {
  const [key, setKey] = useState<ScriptKey>(1);
  const S = SCRIPTS[key];
  const [path, setPath] = useState<string[]>([S.start]);
  const current = path[path.length - 1];
  const n = S.nodes[current];

  useEffect(() => { onChange?.({ key, path }); }, [key, path]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(k: ScriptKey) { setKey(k); setPath([SCRIPTS[k].start]); }
  function goTo(id: string) {
    const i = path.indexOf(id);
    setPath(i !== -1 ? path.slice(0, i + 1) : [...path, id]);
  }
  const stateFor = (id: string, kind?: Kind) => (id === current ? "on" : path.includes(id) ? "done" : kind ?? "");
  const card = (id: string, kind?: Kind) => {
    const node = S.nodes[id];
    return (
      <button className={`panel callmap-node ${stateFor(id, kind)}`} onClick={() => goTo(id)}>
        <span className="callmap-badge">{node.badge}</span>
        <span className="callmap-title">{node.title}</span>
      </button>
    );
  };

  return (
    <>
      <div className="callmap-tabs" role="tablist">
        {KEYS.map((k) => (
          <button key={k} role="tab" aria-selected={k === key} className={`callmap-tab ${k === key ? "on" : ""}`} onClick={() => choose(k)}>
            <b>{SCRIPTS[k].label}</b>
            <span>{SCRIPTS[k].sub}</span>
          </button>
        ))}
      </div>

      <div className="callmap-layout">
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
            <button className="ghost sm" onClick={() => setPath([S.start])}>↺ reiniciar</button>
          </div>
        </div>
      </div>
    </>
  );
}
