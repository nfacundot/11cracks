"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { BilingualActivityDetail, bilingualActivityLabels } from "@/components/player/bilinguisimo/bilingual-activity-detail";
import { useBilingualProgress } from "@/components/player/bilinguisimo/use-bilingual-progress";
import { getBilingualGames } from "@/lib/bilingual/demo-content";
import type { BilingualGameId } from "@/lib/bilingual/game-contracts";
import type { GameCategory } from "@/lib/games";
import { EL_CAMINO_FIRST_PATH, getElCaminoNodeState, type ElCaminoNode } from "@/lib/el-camino/domain";

const bilingualGameIdByCategory: Record<GameCategory, BilingualGameId | null> = {
  OIDO: "oido-de-crack",
  GOL: "gol-de-palabra",
  LETRAS: "letras-de-crack",
  ALIMENTACION: null,
};

function normalizeActivityTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findBilingualActivityNode(stageTitle: string, category: GameCategory | null | undefined): ElCaminoNode | null {
  if (!category) return null;
  const gameId = bilingualGameIdByCategory[category];
  if (!gameId) return null;
  const stage = EL_CAMINO_FIRST_PATH.find((candidate) => normalizeActivityTitle(candidate.title) === normalizeActivityTitle(stageTitle));
  if (!stage) return null;
  return stage.nodes.find((candidate) => candidate.gameId === gameId) ?? null;
}

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

function StageLandmark({ stage }: { stage: EtapaLeccion }) {
  return (
    <div className="el-camino__landmark el-camino__landmark--emoji" style={{ "--stage-accent": stage.color } as CSSProperties}>
      <span className="el-camino__landmark-icon">{stage.emoji}</span>
      <span className="el-camino__landmark-copy"><small>MATERIA {stage.order}</small><strong>{stage.title}</strong><span>{stage.xpReward} XP por materia</span></span>
    </div>
  );
}

function NodeButton({ node, bilingualNode, state, current, onSelect }: { node: NodoLeccion; bilingualNode: ElCaminoNode | null; state: NodoLeccionEstado; current: boolean; onSelect: (node: NodoLeccion) => void }) {
  const locked = state === "LOCKED";
  const isGame = Boolean(bilingualNode) || Boolean(node.gameSlug);
  const title = bilingualNode ? bilingualActivityLabels[bilingualNode.gameId] : node.gameLabel ?? node.title;
  const order = bilingualNode?.order ?? node.order;
  return (
    <button
      type="button"
      className="el-camino__node"
      data-state={state}
      data-current={current}
      data-node-id={node.id}
      disabled={locked}
      aria-label={`${title}, ${isGame ? "Juego" : `${node.questionCount} preguntas, ${node.xpReward} XP`}, ${stateLabels[state]}`}
      onClick={() => onSelect(node)}
    >
      <span className="el-camino__node-orb"><b>{stateIcons[state]}</b><i>{order}</i></span>
      <span className="el-camino__node-copy"><strong>{title}</strong><small>{isGame ? stateLabels[state] : `${node.questionCount} preguntas · ${node.xpReward} XP`}</small></span>
      {current ? <span className="el-camino__current-tag">LA SIGUIENTE LECCIÓN</span> : null}
    </button>
  );
}

function lessonActionLabel(node: NodoLeccion): string {
  const isGame = Boolean(node.gameSlug);
  if (node.estado === "LOCKED") return "BLOQUEADA";
  if (node.estado === "COMPLETED") return isGame ? "VOLVER A JUGAR" : "REPASAR LECCIÓN";
  if (node.estado === "IN_PROGRESS") return isGame ? "CONTINUAR JUEGO" : "CONTINUAR LECCIÓN";
  return isGame ? "JUGAR" : "EMPEZAR LECCIÓN";
}

function NodeDetail({ node, camino, onClose }: { node: NodoLeccion; camino: ClaseCamino; onClose: () => void }) {
  const stage = camino.stages.find((candidate) => candidate.nodes.some((item) => item.id === node.id));
  const total = nodosDeCamino(camino).length;
  const actionLabel = lessonActionLabel(node);
  const locked = node.estado === "LOCKED";
  const isGame = Boolean(node.gameSlug);
  const title = node.gameLabel ?? node.title;
  const actionHref = isGame ? `/jugador/neurocracks/bilinguismo/${node.gameSlug}` : `/jugador/neurocracks/leccion/${node.id}`;
  return (
    <aside className="el-camino__detail" role="dialog" aria-modal="true" aria-labelledby="el-camino-leccion-detail-title">
      <button type="button" className="el-camino__detail-close" onClick={onClose} aria-label="Cerrar">×</button>
      <div className="el-camino__detail-kicker"><span>{stage?.title ?? "Lección"}</span><span data-state={node.estado}>{stateLabels[node.estado]}</span></div>
      <div className="el-camino__leccion-icon" style={{ backgroundColor: node.color }} aria-hidden="true">{node.emoji}</div>
      <h2 id="el-camino-leccion-detail-title">{title}</h2>
      <p className="el-camino__detail-context">{node.description ?? `Lección de ${camino.name}.`}</p>
      <dl className="el-camino__detail-facts">
        <div><dt>CASILLA</dt><dd>{node.order} / {total}</dd></div>
        {isGame ? <div><dt>JUEGO</dt><dd>{title}</dd></div> : <div><dt>RECOMPENSA</dt><dd>+{node.xpReward} XP</dd></div>}
        {!isGame && <div><dt>PREGUNTAS</dt><dd>{node.questionCount}</dd></div>}
        <div><dt>PROGRESO</dt><dd>{node.estado === "COMPLETED" ? "Resuelta" : node.estado === "IN_PROGRESS" ? "En curso" : node.estado === "AVAILABLE" ? "Sin comenzar" : "Completa la anterior"}</dd></div>
        {!isGame && node.bestScore > 0 ? <div><dt>MEJOR PUNTAJE</dt><dd>{node.bestScore} / {node.questionCount}</dd></div> : null}
      </dl>
      {locked ? (
        <span className="el-camino__detail-action el-camino__detail-action--disabled">{actionLabel}</span>
      ) : (
        <Link className="el-camino__detail-action" href={actionHref} onClick={onClose}>{actionLabel}<span aria-hidden="true">→</span></Link>
      )}
      <p className="el-camino__detail-footnote">{isGame ? "El juego abre la experiencia oficial y conserva tu progreso al volver." : "La lección respeta tu progreso y conserva la racha al volver."}</p>
      <span className="el-camino__detail-game">{camino.emoji} {camino.name}</span>
    </aside>
  );
}

export function ElCaminoLecciones({ camino, playerId }: { camino: ClaseCamino; playerId: string }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const router = useRouter();
  const { journey } = useBilingualProgress(playerId);
  const bilingualGames = useMemo(() => getBilingualGames(journey?.targetLanguage ?? "en"), [journey?.targetLanguage]);
  const bilingualByNode = useMemo(() => {
    const map = new Map<string, ElCaminoNode>();
    for (const stage of camino.stages) {
      for (const node of stage.nodes) {
        const bilingualNode = findBilingualActivityNode(stage.title, node.gameCategory);
        if (bilingualNode) map.set(node.id, bilingualNode);
      }
    }
    return map;
  }, [camino]);
  const nodes = nodosDeCamino(camino);
  const total = nodes.length;
  const completed = nodes.filter((node) => node.estado === "COMPLETED").length;
  const current = nodoActualDelCamino(camino);
  const pathComplete = total > 0 && completed === total;
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedBilingualNode = selectedNode ? bilingualByNode.get(selectedNode.id) ?? null : null;
  const selectedBilingualState = selectedBilingualNode ? getElCaminoNodeState(selectedBilingualNode, journey) : null;
  const selectedBilingualGame = selectedBilingualNode
    ? bilingualGames.find((game) => game.id === selectedBilingualNode.gameId) ?? null
    : null;

  useEffect(() => {
    let alive = true;
    let pending = false;
    const refresh = () => {
      if (!alive || pending) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      pending = true;
      try {
        router.refresh();
      } finally {
        window.setTimeout(() => {
          pending = false;
        }, 1500);
      }
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
    <div className="el-camino el-camino--lecciones" data-testid="el-camino-lecciones" data-current-node={current?.id ?? "none"}>
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

        <div className="el-camino__route" data-testid="el-camino-lecciones-route">
          {camino.stages.map((stage, index) => (
            <div className="el-camino__stage-wrap" key={stage.id}>
              <section className="el-camino__stage" data-stage={stage.id} data-state={stageState(camino, stage)} data-flow={flujoEtapa(index)} aria-labelledby={`leccion-stage-${stage.id}`}>
                <StageLandmark stage={stage} />
                <div className="el-camino__stage-track"><div className="el-camino__nodes" role="list" data-testid={`el-camino-lecciones-stage-${stage.id}`}>{stage.nodes.map((node) => { const bilingualNode = bilingualByNode.get(node.id) ?? null; const displayState = bilingualNode ? getElCaminoNodeState(bilingualNode, journey) : node.estado; return <div role="listitem" key={node.id}><NodeButton node={node} bilingualNode={bilingualNode} state={displayState} current={current?.id === node.id} onSelect={(selected) => setSelectedNodeId(selected.id)} /></div>; })}</div></div>
                <span className="el-camino__stage-caption" id={`leccion-stage-${stage.id}`}>{stageState(camino, stage) === "completed" ? stage.title + " SUPERADA" : index === 0 ? "AQUÍ COMIENZAS" : "SIGUIENTE TEMA"}</span>
              </section>
            </div>
          ))}
        </div>
      </section>

      <footer className="el-camino__footer"><span>{total} LECCIONES · {camino.stages.length} MATERIAS</span><span>Las lecciones completadas desbloquean el siguiente paso.</span></footer>

      {selectedNode ? (
        <div className="el-camino__detail-layer" onClick={(event) => { if (event.target === event.currentTarget) setSelectedNodeId(null); }}>
          {selectedBilingualNode && selectedBilingualState && selectedBilingualGame ? (
            <BilingualActivityDetail
              node={selectedBilingualNode}
              state={selectedBilingualState}
              journey={journey}
              mission={null}
              game={selectedBilingualGame}
              lessonId={selectedNode.id}
              onClose={() => setSelectedNodeId(null)}
              onContinueLanguage={() => {}}
            />
          ) : (
            <NodeDetail node={selectedNode} camino={camino} onClose={() => setSelectedNodeId(null)} />
          )}
        </div>
      ) : null}
    </div>
  );
}