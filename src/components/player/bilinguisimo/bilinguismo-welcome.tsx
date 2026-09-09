"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CSSProperties, ReactElement } from "react";
import { getBilingualGames } from "@/lib/bilingual/demo-content";
import type { BilingualGameConfig, BilingualGameId, BilingualJourneyProgress, TargetLanguage } from "@/lib/bilingual/game-contracts";
import type { PlayerLearningMissionView } from "@/lib/bilingual/learning-missions";
import { resolveLearningScheduleGate, type LanguageRequirementProgress } from "@/lib/bilingual/learning-gate";
import { getElCaminoFirstPath, getElCaminoNodeState, type ElCaminoNode, type ElCaminoStage } from "@/lib/el-camino/domain";
import { useBilingualProgress } from "./use-bilingual-progress";
import { ProgressStateChip, type ProgressState } from "@/components/shared/progress-state-chip";

type NodeState = ReturnType<typeof getElCaminoNodeState>;

const mechanicLabels: Record<BilingualGameId, string> = {
  "oido-de-crack": "Oído de Crack",
  "gol-de-palabra": "Gol de Palabra",
  "letras-de-crack": "Letras de Crack",
  "alimentacion": "Alimentación",
};

const stateLabels: Record<NodeState, string> = {
  COMPLETED: "Completada",
  IN_PROGRESS: "En progreso",
  AVAILABLE: "Disponible",
  LOCKED: "Bloqueada",
};

const stateIcons: Record<NodeState, string> = {
  COMPLETED: "✓",
  IN_PROGRESS: "◐",
  AVAILABLE: "→",
  LOCKED: "⌁",
};

const stageIcons: Record<ElCaminoStage["id"], ReactElement> = {
  casa: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m7 22 17-14 17 14" /><path d="M12 20v19h24V20M20 39V27h8v12" /></svg>,
  entrenamiento: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 38h32M12 38V14h24v24M17 14v-5h14v5M19 23h10M19 29h10" /></svg>,
  gastronomia: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 8v13M11 8v8a4 4 0 0 0 8 0V8M15 21v19M31 8v32M31 8c4 2 6 6 6 11v1h-6" /></svg>,
  hotel: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 36V18h32v18M8 29h32M13 24h8v5h-8zM8 40v-4M40 40v-4" /></svg>,
  estadio: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 39 13 13h22l5 26M12 28h24M17 13l2-5h10l2 5M19 39v-7h10v7" /></svg>,
};

function journeyLanguageProgress(journey: BilingualJourneyProgress | null, language: TargetLanguage) {
  const games = getBilingualGames(language);
  const completedGameIds = games.filter((game) => journey?.targetLanguage === language && journey.completedGameIds.includes(game.id)).map((game) => game.id);
  return { completedActivities: completedGameIds.length, requiredActivities: games.length, completedGameIds, nextGameId: games.find((game) => !completedGameIds.includes(game.id))?.id ?? null };
}

function displayedLanguageProgress(mission: PlayerLearningMissionView | null, journey: BilingualJourneyProgress | null, language: TargetLanguage): LanguageRequirementProgress {
  const server = mission?.languageProgress.find((item) => item.language === language);
  const local = journeyLanguageProgress(journey, language);
  const completedGameIds = [...new Set([...(server?.completedGameIds ?? []), ...local.completedGameIds])];
  const games = getBilingualGames(language);
  return { language, label: language === "en" ? "English" : "Português", completedActivities: completedGameIds.length, requiredActivities: server?.requiredActivities ?? games.length, completedGameIds, nextGameId: games.find((game) => !completedGameIds.includes(game.id))?.id ?? null };
}

function stageState(stage: ElCaminoStage, journey: BilingualJourneyProgress | null): "locked" | "active" | "completed" {
  const states = stage.nodes.map((node) => getElCaminoNodeState(node, journey));
  if (states.every((state) => state === "COMPLETED")) return "completed";
  if (states.some((state) => state !== "LOCKED")) return "active";
  return "locked";
}

function nodeProgress(node: ElCaminoNode, journey: BilingualJourneyProgress | null) {
  const session = journey?.sessions[node.gameId];
  if (!session) return "Listo para comenzar";
  return `${session.resolvedItemCount} / ${Math.max(1, session.resolvedItemCount + session.unresolvedItemCount)} resueltas`;
}

function resolveCurrentNode(stages: readonly ElCaminoStage[], journey: BilingualJourneyProgress | null) {
  const nodes = stages.flatMap((stage) => stage.nodes);
  return nodes.find((node) => getElCaminoNodeState(node, journey) === "IN_PROGRESS")
    ?? nodes.find((node) => getElCaminoNodeState(node, journey) === "AVAILABLE")
    ?? null;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="m8 12 2.6 2.6L16.5 9" /></svg>;
}

function ArrowDownIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M6.5 13.5 12 19l5.5-5.5" /></svg>;
}

function StageLandmark({ stage }: { stage: ElCaminoStage }) {
  return <div className="el-camino__landmark" data-stage={stage.id}>
    <span className="el-camino__landmark-icon">{stageIcons[stage.id]}</span>
    <span className="el-camino__landmark-copy"><small>MATERIA {stage.order}</small><strong>{stage.title}</strong><span>{stage.description}</span></span>
  </div>;
}

function NodeButton({ node, state, current, onSelect }: { node: ElCaminoNode; state: NodeState; current: boolean; onSelect: (node: ElCaminoNode) => void }) {
  const locked = state === "LOCKED";
  return <button
    type="button"
    className="el-camino__node"
    data-state={state}
    data-current={current}
    data-node-id={node.id}
    disabled={locked}
    aria-label={`${node.title}, ${mechanicLabels[node.gameId]}, ${stateLabels[state]}`}
    onClick={() => onSelect(node)}
  >
    <span className="el-camino__node-orb"><b>{stateIcons[state]}</b><i>{node.order}</i></span>
    <span className="el-camino__node-copy"><strong>{mechanicLabels[node.gameId]}</strong><small>{stateLabels[state]}</small></span>
    {current ? <span className="el-camino__current-tag">TU SIGUIENTE PASO</span> : null}
  </button>;
}

const demoToolsEnabled = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ENABLE_PLAYER_DEMO_TOOLS === "true";

function NodeDetail({ node, state, journey, mission, game, onClose, onContinueLanguage }: { node: ElCaminoNode; state: NodeState; journey: BilingualJourneyProgress | null; mission: PlayerLearningMissionView | null; game: BilingualGameConfig; onClose: () => void; onContinueLanguage: (language: TargetLanguage, gameId: BilingualGameId) => void }) {
  const session = journey?.sessions[node.gameId];
  const missionCompleted = mission?.status === "COMPLETED";
  const english = displayedLanguageProgress(mission, journey, "en");
  const portuguese = displayedLanguageProgress(mission, journey, "pt");
  const gate = resolveLearningScheduleGate({ missionCompleted, englishCompletedActivities: english.completedActivities, portugueseCompletedActivities: portuguese.completedActivities, scheduleStatus: mission?.schedule.status ?? "LOCKED" });
  const scheduleUnlocked = gate.scheduleAccessUnlocked;
  const canLaunch = state !== "LOCKED";
  const missionActivity = mission?.activities.find((activity) => activity.gameId === node.gameId && activity.language === (journey?.targetLanguage ?? game.session.targetLanguage));
  const sessionTotalResponses = session ? session.resolvedItemCount + session.unresolvedItemCount : undefined;
  const totalResponses = Math.max(1, missionActivity?.totalRequiredItems ?? sessionTotalResponses ?? game.session.objectives.length);
  const resolvedResponses = Math.min(totalResponses, missionActivity?.resolvedItemCount ?? session?.resolvedItemCount ?? 0);
  const languageToContinue = english.completedActivities > 0 ? english : portuguese.completedActivities > 0 ? portuguese : (journey?.targetLanguage === "pt" ? portuguese : english);
  const languageLabel = languageToContinue.label.toUpperCase();
  const actionLabel = !missionCompleted ? (state === "IN_PROGRESS" ? "CONTINUAR MISIÓN" : "EMPEZAR MISIÓN") : !gate.languageRequirementCompleted ? languageToContinue.completedActivities > 0 ? `CONTINUAR ${languageLabel}` : "ELEGIR IDIOMA" : "REQUISITOS COMPLETADOS";
  const actionGameId = languageToContinue.nextGameId ?? node.gameId;
  const actionHref = !missionCompleted ? `/jugador/neurocracks/bilinguismo/${node.gameId}` : !gate.languageRequirementCompleted ? `/jugador/neurocracks/bilinguismo/${actionGameId}` : `/jugador/neurocracks/bilinguismo/${node.gameId}`;
  const scheduleMessage = scheduleUnlocked
    ? "Acceso disponible según los dos requisitos completados."
    : gate.waitingForCoachPublication
      ? "Requisitos completados. Tu entrenador todavía no ha publicado el próximo horario."
      : "Completa ambos requisitos para desbloquear el acceso.";
  const languageRows = [english, portuguese];
  return <aside className="el-camino__detail" role="dialog" aria-modal="true" aria-labelledby="el-camino-detail-title">
    <button type="button" className="el-camino__detail-close" onClick={onClose} aria-label="Cerrar detalle">×</button>
    <div className="el-camino__detail-kicker"><span>{node.stageTitle}</span><span data-state={state}>{stateLabels[state]}</span></div>
    <h2 id="el-camino-detail-title">{mechanicLabels[node.gameId]}</h2>
    <p className="el-camino__detail-context">{node.context}</p>
    <section className="el-camino__mission-gate" aria-labelledby="el-camino-mission-title" data-schedule-state={scheduleUnlocked ? "unlocked" : gate.waitingForCoachPublication ? "pending" : "locked"}>
      <div className="el-camino__mission-heading">
        <div><span>TU MISIÓN</span><h3 id="el-camino-mission-title">COMPLETA TU ACTIVIDAD</h3><p>Completa esta misión para desbloquear el acceso a tu próximo horario.</p></div>
      </div>
      <div className="el-camino__mission-progress" role="group" aria-label={`${resolvedResponses} de ${totalResponses} respuestas resueltas`}>
        <div className="el-camino__mission-progress-label"><strong>{resolvedResponses} / {totalResponses} RESPUESTAS RESUELTAS</strong></div>
        <div className="el-camino__mission-segments" role="progressbar" aria-valuemin={0} aria-valuemax={totalResponses} aria-valuenow={resolvedResponses}>
          {Array.from({ length: totalResponses }, (_, index) => <i key={index} data-filled={index < resolvedResponses} aria-hidden="true" />)}
        </div>
      </div>
      <div className="el-camino__mission-requirements" aria-label="Requisitos para desbloquear">
        <span className="el-camino__mission-requirements-title">REQUISITOS PARA DESBLOQUEAR</span>
        <div className="el-camino__mission-requirement" data-complete={missionCompleted}>
          <span className="el-camino__mission-requirement-mark" aria-hidden="true">{missionCompleted ? "✓" : "○"}</span>
          <div><strong>MISIÓN DE APRENDIZAJE</strong><span>{missionCompleted ? `${totalResponses} / ${totalResponses} respuestas` : `${resolvedResponses} / ${totalResponses} respuestas`}</span></div>
        </div>
        <div className="el-camino__mission-requirement el-camino__mission-requirement--language" data-complete={gate.languageRequirementCompleted}>
          <span className="el-camino__mission-requirement-mark" aria-hidden="true">{gate.languageRequirementCompleted ? "✓" : "○"}</span>
          <div><strong>IDIOMA · COMPLETA UN IDIOMA</strong><span>Completa las 3 actividades de uno de los dos idiomas.</span></div>
          <div className="el-camino__mission-language-list">
            {languageRows.map((item) => <div key={item.language} className="el-camino__mission-language" data-complete={item.completedActivities >= item.requiredActivities}><span>{item.label}</span><span className="el-camino__mission-language-segments" aria-label={`${item.label}: ${item.completedActivities} de ${item.requiredActivities}`} role="progressbar" aria-valuemin={0} aria-valuemax={item.requiredActivities} aria-valuenow={item.completedActivities}>{Array.from({ length: item.requiredActivities }, (_, index) => <i key={index} data-filled={index < item.completedActivities} aria-hidden="true" />)}</span><strong>{item.completedActivities} / {item.requiredActivities}</strong></div>)}
          </div>
        </div>
      </div>
      <div className="el-camino__mission-connector" aria-hidden="true"><ArrowDownIcon /></div>
        <div className="el-camino__mission-reward">
          <span className="el-camino__mission-reward-icon">{scheduleUnlocked ? <CheckIcon /> : <LockIcon />}</span>
          <div><span>PRÓXIMO HORARIO</span><strong>{scheduleUnlocked && mission ? mission.schedule.title : "BLOQUEADO"}</strong><p>{scheduleMessage}</p>{scheduleUnlocked && mission?.schedule.location ? <small>{mission.schedule.location}</small> : null}</div>
        </div>
        {canLaunch && !gate.requirementsCompleted ? <Link className="el-camino__detail-action el-camino__mission-action" href={actionHref} onClick={(event) => { if (missionCompleted && !gate.languageRequirementCompleted) { event.preventDefault(); onContinueLanguage(languageToContinue.language, actionGameId); } else onClose(); }}>{actionLabel}<span aria-hidden="true">→</span></Link> : <span className={`el-camino__detail-action el-camino__mission-action${gate.requirementsCompleted ? " el-camino__mission-action--complete" : " el-camino__detail-action--disabled"}`}>{gate.requirementsCompleted ? "REQUISITOS COMPLETADOS" : "BLOQUEADA"}</span>}
      </section>
    <dl className="el-camino__detail-facts">
      <div><dt>CASILLA</dt><dd>{node.order} / 15</dd></div>
      <div><dt>PROGRESO</dt><dd>{session ? nodeProgress(node, journey) : state === "COMPLETED" ? "Resuelta" : "Sin comenzar"}</dd></div>
      <div><dt>IDIOMA</dt><dd>{journey?.targetLanguage === "pt" ? "Português" : "English"}</dd></div>
    </dl>
    <p className="el-camino__detail-footnote">La actividad abre el juego oficial y conserva tu progreso al volver.</p>
    <span className="el-camino__detail-game" aria-hidden="true">{game.shortLabel}</span>
  </aside>;
}

export function BilinguismoWelcome({ playerId, mission = null }: { playerId: string; mission?: PlayerLearningMissionView | null }) {
  const { journey, resetGame, resetAll, setLanguage } = useBilingualProgress(playerId);
  const router = useRouter();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const targetLanguage: TargetLanguage = journey?.targetLanguage ?? "en";
  const games = getBilingualGames(targetLanguage);
  const gameById = new Map(games.map((game) => [game.id, game]));
  const stages = getElCaminoFirstPath();
  const currentNode = resolveCurrentNode(stages, journey);
  const selectedNode = stages.flatMap((stage) => stage.nodes).find((node) => node.id === selectedNodeId) ?? null;
  const selectedState = selectedNode ? getElCaminoNodeState(selectedNode, journey) : null;
  const completedNodes = stages.flatMap((stage) => stage.nodes).filter((node) => getElCaminoNodeState(node, journey) === "COMPLETED").length;
  const pathComplete = completedNodes === 15;

  const resetAndOpen = (game: BilingualGameConfig) => {
    resetGame(game.session);
    router.push(`/jugador/neurocracks/bilinguismo/${game.id}`);
  };

  return <div className="el-camino" data-testid="el-camino-path" data-current-node={currentNode?.id ?? "none"}>
    <header className="el-camino__header">
      <div className="el-camino__header-copy">
        <span className="el-camino__eyebrow">EL CAMINO · CAMINO 1</span>
        <h1>RUMBO <em>AL</em> ESTADIO</h1>
        <p>Una ruta de palabras para llegar preparado al gran momento.</p>
      </div>
      <div className="el-camino__header-status"><span>PROGRESO DEL CAMINO</span><strong>{completedNodes}<small>/15</small></strong><i style={{ "--progress": `${(completedNodes / 15) * 100}%` } as CSSProperties} /></div>
    </header>

    <div className="el-camino__toolbar">
      <div className="el-camino__legend" aria-label="Estados del camino">
        {(Object.keys(stateLabels) as NodeState[]).map((state) => <ProgressStateChip key={state} state={state as ProgressState} icon={stateIcons[state]} label={stateLabels[state]} />)}
      </div>
      <div className="el-camino__language" role="group" aria-label="Idioma de aprendizaje">
        {([ ["en", "EN", "English"], ["pt", "PT", "Português"] ] as const).map(([language, code, label]) => { const progress = journeyLanguageProgress(journey, language); return <button key={language} type="button" aria-pressed={targetLanguage === language} data-selected={targetLanguage === language} onClick={() => setLanguage(language)}>{code}<span>{label} · {progress.completedActivities}/{progress.requiredActivities}</span></button>; })}
      </div>
    </div>

    {pathComplete ? <section className="el-camino__completion" data-testid="el-camino-complete" aria-live="polite"><span>CAMINO 1</span><h2>¡LLEGASTE AL ESTADIO!</h2><p>Completaste las 15 actividades del recorrido inicial.</p></section> : null}

    <section className="el-camino__map" aria-labelledby="el-camino-map-title">
      <div className="el-camino__map-heading"><div><span>RUTA ACTUAL</span><h2 id="el-camino-map-title">El Camino</h2></div><p>{currentNode ? <>CONTINÚA EN <strong>{currentNode.stageTitle}</strong> · {mechanicLabels[currentNode.gameId]}</> : "No hay una actividad disponible todavía."}</p></div>
      <div className="el-camino__route" data-testid="el-camino-route">
        {stages.map((stage, index) => <div className="el-camino__stage-wrap" key={stage.id}>
          <section className="el-camino__stage" data-stage={stage.id} data-state={stageState(stage, journey)} data-flow={index % 2 === 0 ? "forward" : "back"} aria-labelledby={`stage-${stage.id}`}>
            <StageLandmark stage={stage} />
            <div className="el-camino__stage-track"><div className="el-camino__nodes" role="list" data-testid={`el-camino-stage-${stage.id}`}>{stage.nodes.map((node) => { const state = getElCaminoNodeState(node, journey); return <div role="listitem" key={node.id}><NodeButton node={node} state={state} current={currentNode?.id === node.id} onSelect={(selected) => setSelectedNodeId(selected.id)} /></div>; })}</div></div>
            <span className="el-camino__stage-caption" id={`stage-${stage.id}`}>{stage.order === 1 ? "AQUÍ COMIENZAS" : stage.order === 5 ? "EL GRAN MOMENTO" : "SIGUIENTE MUNDO"}</span>
            {stageState(stage, journey) === "completed" ? <span className="el-camino__stage-completion" data-testid={`el-camino-stage-${stage.id}-complete`}>{stage.title} SUPERADA{stages[index + 1] ? ` · ${stages[index + 1].title} DESBLOQUEADO` : " · CAMINO COMPLETADO"}</span> : null}
          </section>
        </div>)}
      </div>
    </section>

    <footer className="el-camino__footer"><span>15 LECCIONES · 5 MATERIAS</span><span>Las actividades completadas desbloquean el siguiente paso.</span></footer>

    {selectedNode && selectedState ? <div className="el-camino__detail-layer" onClick={(event) => { if (event.target === event.currentTarget) setSelectedNodeId(null); }}><NodeDetail node={selectedNode} state={selectedState} journey={journey} mission={mission} game={gameById.get(selectedNode.gameId) ?? games[0]} onClose={() => setSelectedNodeId(null)} onContinueLanguage={(language, gameId) => { setLanguage(language); setSelectedNodeId(null); router.push(`/jugador/neurocracks/bilinguismo/${gameId}`); }} /></div> : null}

    {demoToolsEnabled ? <details className="el-camino__demo"><summary>Herramientas de demo</summary><div>{games.map((game) => <button type="button" key={game.id} onClick={() => resetAndOpen(game)}>Reiniciar {game.shortLabel}</button>)}<button type="button" onClick={() => { resetAll(); router.push("/jugador/neurocracks"); }}>Reiniciar El Camino</button></div></details> : null}
  </div>;
}
