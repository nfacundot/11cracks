"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  flujoEtapa,
  nodoActualDelCamino,
  nodosDeCamino,
  type ClaseCamino,
  type EtapaLeccion,
  type NodoLeccion,
  type NodoLeccionEstado,
} from "@/lib/el-camino/lecciones";
import { ProgressStateChip, type ProgressState } from "@/components/shared/progress-state-chip";

const stateLabels: Record<NodoLeccionEstado, string> = {
  COMPLETED: "Completada",
  IN_PROGRESS: "En progreso",
  AVAILABLE: "Disponible",
  LOCKED: "Bloqueada",
};

const stateIcons: Record<NodoLeccionEstado, string> = {
  COMPLETED: "✓",
  IN_PROGRESS: "◐",
  AVAILABLE: "→",
  LOCKED: "⌁",
};

function stageState(camino: ClaseCamino, stage: EtapaLeccion): "locked" | "active" | "completed" {
  const nodes = stage.nodes;
  if (nodes.length === 0) return "locked";
  if (nodes.every((node) => node.estado === "COMPLETED")) return "completed";
  if (nodes.some((node) => node.estado !== "LOCKED")) return "active";
  return "locked";
}

function useFreePositions(camino: ClaseCamino): boolean {
  const editable = camino.stages.filter((stage) => stage.posX !== undefined && stage.posY !== undefined);
  const editableLessons = camino.stages.some((stage) =>
    stage.nodes.some((node) => node.posX !== undefined && node.posY !== undefined)
  );
  if (editable.length === 0 && !editableLessons) return false;
  const stagesOff = editable.some((stage) => Math.abs(stage.posX! - 50) > 2 || Math.abs(stage.posY! - 50) > 2);
  const lessonsOff = camino.stages.some((stage) =>
    stage.nodes.some((node) => node.posX !== undefined && node.posY !== undefined && (Math.abs(node.posX! - 50) > 2 || Math.abs(node.posY! - 50) > 2))
  );
  return stagesOff || lessonsOff;
}

function nodeMapPosition(stage: EtapaLeccion, node: NodoLeccion, index: number): { posX: number; posY: number } {
  if (node.posX !== undefined && node.posY !== undefined) return { posX: node.posX, posY: node.posY };
  const base = { posX: stage.posX ?? 50, posY: stage.posY ?? 50 };
  const offsets = [
    { posX: -15, posY: -10 },
    { posX: 15, posY: -10 },
    { posX: 0, posY: 14 },
  ];
  const offset = offsets[index % offsets.length];
  const clamp = (value: number) => Math.min(94, Math.max(6, value));
  return { posX: clamp(base.posX + offset.posX), posY: clamp(base.posY + offset.posY) };
}

function StageLandmark({ stage }: { stage: EtapaLeccion }) {
  return (
    <div className="el-camino__landmark el-camino__landmark--emoji" style={{ "--stage-accent": stage.color } as CSSProperties}>
      <span className="el-camino__landmark-icon">{stage.emoji}</span>
      <span className="el-camino__landmark-copy"><small>MATERIA {stage.order}</small><strong>{stage.title}</strong><span>{stage.xpReward} XP por materia</span></span>
    </div>
  );
}

function NodeButton({ node, current, onSelect }: { node: NodoLeccion; current: boolean; onSelect: (node: NodoLeccion) => void }) {
  const locked = node.estado === "LOCKED";
  return (
    <button
      type="button"
      className="el-camino__node"
      data-state={node.estado}
      data-current={current}
      data-node-id={node.id}
      disabled={locked}
      aria-label={`${node.title}, ${stateLabels[node.estado]}, ${node.questionCount} preguntas, ${node.xpReward} XP`}
      onClick={() => onSelect(node)}
    >
      <span className="el-camino__node-orb"><b>{stateIcons[node.estado]}</b><i>{node.order}</i></span>
      <span className="el-camino__node-copy"><strong>{node.title}</strong><small>{node.questionCount} preguntas · {node.xpReward} XP</small></span>
      {current ? <span className="el-camino__current-tag">LA SIGUIENTE LECCIÓN</span> : null}
    </button>
  );
}

function lessonActionLabel(node: NodoLeccion): string {
  if (node.estado === "LOCKED") return "BLOQUEADA";
  if (node.estado === "COMPLETED") return "REPASAR LECCIÓN";
  if (node.estado === "IN_PROGRESS") return "CONTINUAR LECCIÓN";
  return "EMPEZAR LECCIÓN";
}

function NodeDetail({ node, camino, onClose }: { node: NodoLeccion; camino: ClaseCamino; onClose: () => void }) {
  const stage = camino.stages.find((candidate) => candidate.nodes.some((item) => item.id === node.id));
  const total = nodosDeCamino(camino).length;
  const actionLabel = lessonActionLabel(node);
  const locked = node.estado === "LOCKED";
  return (
    <aside className="el-camino__detail" role="dialog" aria-modal="true" aria-labelledby="el-camino-leccion-detail-title">
      <button type="button" className="el-camino__detail-close" onClick={onClose} aria-label="Cerrar detalle">×</button>
      <div className="el-camino__detail-kicker"><span>{stage?.title ?? "Lección"}</span><span data-state={node.estado}>{stateLabels[node.estado]}</span></div>
      <div className="el-camino__leccion-icon" style={{ backgroundColor: node.color }} aria-hidden="true">{node.emoji}</div>
      <h2 id="el-camino-leccion-detail-title">{node.title}</h2>
      <p className="el-camino__detail-context">{node.description ?? `Lección de ${camino.name}.`}</p>
      <dl className="el-camino__detail-facts">
        <div><dt>CASILLA</dt><dd>{node.order} / {total}</dd></div>
        <div><dt>RECOMPENSA</dt><dd>+{node.xpReward} XP</dd></div>
        <div><dt>PREGUNTAS</dt><dd>{node.questionCount}</dd></div>
        <div><dt>PROGRESO</dt><dd>{node.estado === "COMPLETED" ? "Resuelta" : node.estado === "IN_PROGRESS" ? "En curso" : node.estado === "AVAILABLE" ? "Sin comenzar" : "Completa la anterior"}</dd></div>
        {node.bestScore > 0 ? <div><dt>MEJOR PUNTAJE</dt><dd>{node.bestScore} / {node.questionCount}</dd></div> : null}
      </dl>
      {locked ? (
        <span className="el-camino__detail-action el-camino__detail-action--disabled">{actionLabel}</span>
      ) : (
        <Link className="el-camino__detail-action" href={`/jugador/neurocracks/leccion/${node.id}`} onClick={onClose}>{actionLabel}<span aria-hidden="true">→</span></Link>
      )}
      <p className="el-camino__detail-footnote">La lección respeta tu progreso y conserva la racha al volver.</p>
      <span className="el-camino__detail-game">{camino.emoji} {camino.name}</span>
    </aside>
  );
}

export function ElCaminoLecciones({ camino }: { camino: ClaseCamino }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const router = useRouter();
  const nodes = nodosDeCamino(camino);
  const total = nodes.length;
  const completed = nodes.filter((node) => node.estado === "COMPLETED").length;
  const current = nodoActualDelCamino(camino);
  const pathComplete = total > 0 && completed === total;
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const freeForm = useFreePositions(camino);
  const canvasHeight = Math.max(1150, camino.stages.length * 460);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (alive) router.refresh();
    };
    const focusHandler = () => refresh();
    window.addEventListener("focus", focusHandler);
    const interval = window.setInterval(refresh, 8000);
    return () => {
      alive = false;
      window.removeEventListener("focus", focusHandler);
      window.clearInterval(interval);
    };
  }, [router]);

  return (
    <div className={`el-camino el-camino--lecciones${freeForm ? " el-camino--map" : ""}`} data-testid="el-camino-lecciones" data-current-node={current?.id ?? "none"}>
      <header className="el-camino__header">
        <div className="el-camino__header-copy">
          <span className="el-camino__eyebrow">EL CAMINO · MATERIA {camino.order + 1}</span>
          <h1>{camino.name}</h1>
          <p>{camino.description ?? "Recorre las lecciones de este camino para crecer."}</p>
        </div>
        <div className="el-camino__header-status"><span>PROGRESO DEL CAMINO</span><strong>{completed}<small>/{total}</small></strong><i style={{ "--progress": `${total > 0 ? (completed / total) * 100 : 0}%` } as CSSProperties} /></div>
      </header>

      <div className="el-camino__toolbar">
        <div className="el-camino__legend" aria-label="Estados de las lecciones">
          {(Object.keys(stateLabels) as NodoLeccionEstado[]).map((state) => <ProgressStateChip key={state} state={state as ProgressState} icon={stateIcons[state]} label={stateLabels[state]} />)}
        </div>
        <div className="el-camino__clase-badge">{camino.emoji}<span>{camino.name}</span></div>
      </div>

      {pathComplete ? <section className="el-camino__completion" data-testid="el-camino-lecciones-complete" aria-live="polite"><span>CAMINO COMPLETADO</span><h2>¡LO LOGRASTE!</h2><p>Completaste las {total} lecciones de este camino.</p></section> : null}

      <section className="el-camino__map" aria-labelledby="el-camino-lecciones-map-title">
        <div className="el-camino__map-heading"><div><span>RUTA ACTUAL</span><h2 id="el-camino-lecciones-map-title">El Camino</h2></div><p>{current ? <>CONTINÚA EN <strong>{current.title}</strong> · LECCIÓN {current.order} DE {total}</> : "No hay una lección disponible todavía."}</p></div>

        {freeForm ? (
          <div className="el-camino__map-canvas" style={{ height: canvasHeight }} data-testid="el-camino-lecciones-canvas">
            <Image
              src="/img/back/backa.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 78rem) 100vw, 78rem"
              className="el-camino__map-canvas-bg"
              draggable={false}
            />
            {camino.stages.map((stage) => {
              const posX = stage.posX ?? 50;
              const posY = stage.posY ?? 50;
              return (
                <div className="el-camino__map-stage" key={stage.id} data-state={stageState(camino, stage)} style={{ left: `${posX}%`, top: `${posY}%` }}>
                  <StageLandmark stage={stage} />
                </div>
              );
            })}
            {camino.stages.flatMap((stage) =>
              stage.nodes.map((node, index) => {
                const nodePos = nodeMapPosition(stage, node, index);
                return (
                  <div
                    className="el-camino__map-lesson"
                    key={node.id}
                    data-stage={stage.id}
                    style={{ left: `${nodePos.posX}%`, top: `${nodePos.posY}%` }}
                  >
                    <NodeButton node={node} current={current?.id === node.id} onSelect={(selected) => setSelectedNodeId(selected.id)} />
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="el-camino__route" data-testid="el-camino-lecciones-route">
            {camino.stages.map((stage, index) => (
              <div className="el-camino__stage-wrap" key={stage.id}>
                <section className="el-camino__stage" data-stage={stage.id} data-state={stageState(camino, stage)} data-flow={flujoEtapa(index)} aria-labelledby={`leccion-stage-${stage.id}`}>
                  <StageLandmark stage={stage} />
                  <div className="el-camino__stage-track"><div className="el-camino__nodes" role="list" data-testid={`el-camino-lecciones-stage-${stage.id}`}>{stage.nodes.map((node) => <div role="listitem" key={node.id}><NodeButton node={node} current={current?.id === node.id} onSelect={(selected) => setSelectedNodeId(selected.id)} /></div>)}</div></div>
                  <span className="el-camino__stage-caption" id={`leccion-stage-${stage.id}`}>{stageState(camino, stage) === "completed" ? stage.title + " SUPERADA" : index === 0 ? "AQUÍ COMIENZAS" : "SIGUIENTE TEMA"}</span>
                </section>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="el-camino__footer"><span>{total} LECCIONES · {camino.stages.length} MATERIAS</span><span>Las lecciones completadas desbloquean el siguiente paso.</span></footer>

      {selectedNode ? <div className="el-camino__detail-layer" onClick={(event) => { if (event.target === event.currentTarget) setSelectedNodeId(null); }}><NodeDetail node={selectedNode} camino={camino} onClose={() => setSelectedNodeId(null)} /></div> : null}
    </div>
  );
}