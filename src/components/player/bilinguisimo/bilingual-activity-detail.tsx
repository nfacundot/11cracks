"use client";

import Link from "next/link";
import { getBilingualGames } from "@/lib/bilingual/demo-content";
import type {
  BilingualGameConfig,
  BilingualGameId,
  BilingualJourneyProgress,
  TargetLanguage,
} from "@/lib/bilingual/game-contracts";
import type { PlayerLearningMissionView } from "@/lib/bilingual/learning-missions";
import { resolveLearningScheduleGate, type LanguageRequirementProgress } from "@/lib/bilingual/learning-gate";
import type { ElCaminoNode } from "@/lib/el-camino/domain";

export const bilingualActivityLabels: Record<BilingualGameId, string> = {
  "oido-de-crack": "Oído de Crack",
  "gol-de-palabra": "Gol de Palabra",
  "letras-de-crack": "Letras de Crack",
  "alimentacion": "Alimentación",
};

const stateLabels = {
  COMPLETED: "Completada",
  IN_PROGRESS: "En progreso",
  AVAILABLE: "Disponible",
  LOCKED: "Bloqueada",
} as const;

type BilingualNodeState = keyof typeof stateLabels;

function journeyLanguageProgress(journey: BilingualJourneyProgress | null, language: TargetLanguage) {
  const games = getBilingualGames(language);
  const completedGameIds = games
    .filter((game) => journey?.targetLanguage === language && journey.completedGameIds.includes(game.id))
    .map((game) => game.id);
  return {
    completedActivities: completedGameIds.length,
    requiredActivities: games.length,
    completedGameIds,
    nextGameId: games.find((game) => !completedGameIds.includes(game.id))?.id ?? null,
  };
}

function displayedLanguageProgress(
  mission: PlayerLearningMissionView | null,
  journey: BilingualJourneyProgress | null,
  language: TargetLanguage
): LanguageRequirementProgress {
  const server = mission?.languageProgress.find((item) => item.language === language);
  const local = journeyLanguageProgress(journey, language);
  const completedGameIds = [...new Set([...(server?.completedGameIds ?? []), ...local.completedGameIds])];
  const games = getBilingualGames(language);
  return {
    language,
    label: language === "en" ? "English" : "Português",
    completedActivities: completedGameIds.length,
    requiredActivities: server?.requiredActivities ?? games.length,
    completedGameIds,
    nextGameId: games.find((game) => !completedGameIds.includes(game.id))?.id ?? null,
  };
}

function nodeProgress(node: ElCaminoNode, journey: BilingualJourneyProgress | null) {
  const session = journey?.sessions[node.gameId];
  if (!session) return "Listo para comenzar";
  return `${session.resolvedItemCount} / ${Math.max(1, session.resolvedItemCount + session.unresolvedItemCount)} resueltas`;
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

export function BilingualActivityDetail({
  node,
  state,
  journey,
  mission,
  game,
  lessonId,
  onClose,
  onContinueLanguage,
}: {
  node: ElCaminoNode;
  state: BilingualNodeState;
  journey: BilingualJourneyProgress | null;
  mission: PlayerLearningMissionView | null;
  game: BilingualGameConfig;
  lessonId?: string | null;
  onClose: () => void;
  onContinueLanguage: (language: TargetLanguage, gameId: BilingualGameId) => void;
}) {
  const session = journey?.sessions[node.gameId];
  const missionCompleted = mission?.status === "COMPLETED";
  const english = displayedLanguageProgress(mission, journey, "en");
  const portuguese = displayedLanguageProgress(mission, journey, "pt");
  const gate = resolveLearningScheduleGate({
    missionCompleted,
    englishCompletedActivities: english.completedActivities,
    portugueseCompletedActivities: portuguese.completedActivities,
    scheduleStatus: mission?.schedule.status ?? "LOCKED",
  });
  const scheduleUnlocked = gate.scheduleAccessUnlocked;
  const canLaunch = state !== "LOCKED";
  const missionActivity = mission?.activities.find(
    (activity) => activity.gameId === node.gameId && activity.language === (journey?.targetLanguage ?? game.session.targetLanguage)
  );
  const sessionTotalResponses = session ? session.resolvedItemCount + session.unresolvedItemCount : undefined;
  const totalResponses = Math.max(1, missionActivity?.totalRequiredItems ?? sessionTotalResponses ?? game.session.objectives.length);
  const resolvedResponses = Math.min(totalResponses, missionActivity?.resolvedItemCount ?? session?.resolvedItemCount ?? 0);
  const languageToContinue = english.completedActivities > 0
    ? english
    : portuguese.completedActivities > 0
      ? portuguese
      : journey?.targetLanguage === "pt" ? portuguese : english;
  const languageLabel = languageToContinue.label.toUpperCase();
  const actionLabel = !missionCompleted
    ? state === "IN_PROGRESS" ? "CONTINUAR MISIÓN" : "EMPEZAR MISIÓN"
    : !gate.languageRequirementCompleted
      ? languageToContinue.completedActivities > 0 ? `CONTINUAR ${languageLabel}` : "ELEGIR IDIOMA"
      : "REQUISITOS COMPLETADOS";
  const actionGameId = languageToContinue.nextGameId ?? node.gameId;
  const withLesson = (path: string) => (lessonId ? `${path}?lesson=${encodeURIComponent(lessonId)}` : path);
  const actionHref = withLesson(!missionCompleted
    ? `/jugador/neurocracks/bilinguismo/${node.gameId}`
    : !gate.languageRequirementCompleted
      ? `/jugador/neurocracks/bilinguismo/${actionGameId}`
      : `/jugador/neurocracks/bilinguismo/${node.gameId}`);
  const scheduleMessage = scheduleUnlocked
    ? "Acceso disponible según los dos requisitos completados."
    : gate.waitingForCoachPublication
      ? "Requisitos completados. Tu entrenador todavía no ha publicado el próximo horario."
      : "Completa ambos requisitos para desbloquear el acceso.";
  const languageRows = [english, portuguese];

  return (
    <aside className="el-camino__detail" role="dialog" aria-modal="true" aria-labelledby="el-camino-detail-title">
      <button type="button" className="el-camino__detail-close" onClick={onClose} aria-label="Cerrar detalle">×</button>
      <div className="el-camino__detail-kicker"><span>{node.stageTitle}</span><span data-state={state}>{stateLabels[state]}</span></div>
      <h2 id="el-camino-detail-title">{bilingualActivityLabels[node.gameId]}</h2>
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
              {languageRows.map((item) => (
                <div key={item.language} className="el-camino__mission-language" data-complete={item.completedActivities >= item.requiredActivities}>
                  <span>{item.label}</span>
                  <span className="el-camino__mission-language-segments" aria-label={`${item.label}: ${item.completedActivities} de ${item.requiredActivities}`} role="progressbar" aria-valuemin={0} aria-valuemax={item.requiredActivities} aria-valuenow={item.completedActivities}>
                    {Array.from({ length: item.requiredActivities }, (_, index) => <i key={index} data-filled={index < item.completedActivities} aria-hidden="true" />)}
                  </span>
                  <strong>{item.completedActivities} / {item.requiredActivities}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="el-camino__mission-connector" aria-hidden="true"><ArrowDownIcon /></div>
        <div className="el-camino__mission-reward">
          <span className="el-camino__mission-reward-icon">{scheduleUnlocked ? <CheckIcon /> : <LockIcon />}</span>
          <div>
            <span>PRÓXIMO HORARIO</span>
            <strong>{scheduleUnlocked && mission ? mission.schedule.title : "BLOQUEADO"}</strong>
            <p>{scheduleMessage}</p>
            {scheduleUnlocked && mission?.schedule.location ? <small>{mission.schedule.location}</small> : null}
          </div>
        </div>
        {canLaunch && !gate.requirementsCompleted ? (
          <Link className="el-camino__detail-action el-camino__mission-action" href={actionHref} onClick={(event) => { if (missionCompleted && !gate.languageRequirementCompleted) { event.preventDefault(); onContinueLanguage(languageToContinue.language, actionGameId); } else onClose(); }}>{actionLabel}<span aria-hidden="true">→</span></Link>
        ) : (
          <span className={`el-camino__detail-action el-camino__mission-action${gate.requirementsCompleted ? " el-camino__mission-action--complete" : " el-camino__detail-action--disabled"}`}>{gate.requirementsCompleted ? "REQUISITOS COMPLETADOS" : "BLOQUEADA"}</span>
        )}
      </section>
      <dl className="el-camino__detail-facts">
        <div><dt>CASILLA</dt><dd>{node.order} / 15</dd></div>
        <div><dt>PROGRESO</dt><dd>{session ? nodeProgress(node, journey) : state === "COMPLETED" ? "Resuelta" : "Sin comenzar"}</dd></div>
        <div><dt>IDIOMA</dt><dd>{journey?.targetLanguage === "pt" ? "Português" : "English"}</dd></div>
      </dl>
      <p className="el-camino__detail-footnote">La actividad abre el juego oficial y conserva tu progreso al volver.</p>
      <span className="el-camino__detail-game" aria-hidden="true">{game.shortLabel}</span>
    </aside>
  );
}