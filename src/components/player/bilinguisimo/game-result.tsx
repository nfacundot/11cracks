"use client";

import Link from "next/link";
import type { BilingualGameConfig, BilingualSessionProgress } from "@/lib/bilingual/game-contracts";
import { getNextBilingualGame } from "@/lib/bilingual/demo-content";
import { getReviewObjectiveIds } from "@/lib/bilingual/session-engine";
import type { PlayerLearningMissionView } from "@/lib/bilingual/learning-missions";

export function GameResult({
  game,
  progress,
  mission,
  reward,
  nextHref,
  onReview,
  onNext,
  onReplay,
}: {
  game: BilingualGameConfig;
  progress: BilingualSessionProgress;
  mission?: PlayerLearningMissionView | null;
  reward?: { earnedXp: number; perfect: boolean; streak: number } | null;
  nextHref?: string | null;
  onReview: () => void;
  onNext: () => void;
  onReplay?: () => void;
}) {
  const pendingReview = getReviewObjectiveIds(progress);
  const correctWithoutError = progress.firstTryCorrectCount ?? Object.values(progress.objectiveStates).filter((state) => state.correct && !state.incorrect).length;
  const completion = progress.finalResolutionPercent ?? Math.round((progress.completedObjectiveIds.length / game.session.objectives.length) * 100);
  const nextGame = getNextBilingualGame(game.id, game.session.targetLanguage);
  const reviewLabel = `${pendingReview.length} ${pendingReview.length === 1 ? "objetivo" : "objetivos"}`;

  return (
    <section className="bilingual-result" aria-labelledby="result-title">
      <div className="bilingual-result__score" aria-label={`${completion} por ciento completado`}>
        <span>{completion}</span><small>%</small>
      </div>
      <div className="bilingual-result__copy">
        <p>{game.session.environmentLabel} · {game.session.title} · {game.session.targetLanguage === "pt" ? "Português" : "English"}</p>
        <h1 id="result-title">{mission?.status === "COMPLETED" ? "¡Misión completada!" : "Sesión completada"}</h1>
        <strong>{pendingReview.length > 0 ? "Ya sabes qué reforzar. Ese también es progreso." : "Lectura de juego perfecta. Buen trabajo."}</strong>
      </div>
      <dl className="bilingual-result__summary">
        <div><dt>Objetivos completados</dt><dd>{progress.completedObjectiveIds.length}/{game.session.objectives.length}</dd></div>
        <div><dt>Correctos al primer intento</dt><dd>{correctWithoutError}</dd></div>
        <div><dt>Para reforzar</dt><dd>{pendingReview.length}</dd></div>
        {reward ? <div><dt>XP ganada</dt><dd>{reward.earnedXp}</dd></div> : null}
        {reward && reward.streak > 1 ? <div><dt>Racha actual</dt><dd>{reward.streak} días</dd></div> : null}
      </dl>
      <div className="bilingual-result__actions">
        {mission?.status === "COMPLETED" ? <div className="bilingual-result__schedule" data-testid="el-camino-schedule-unlocked"><span>PRÓXIMO HORARIO · DESBLOQUEADO</span><strong>{mission.schedule.title}</strong><small>Tu misión desbloqueó este bloque de entrenamiento.</small><Link className="bilingual-action bilingual-action--secondary" href="/jugador/training">Ver entrenamiento</Link></div> : null}
        {pendingReview.length > 0 ? (
          <button className="bilingual-action bilingual-action--primary" type="button" onClick={onReview}>Repasar ahora · {reviewLabel}</button>
        ) : nextHref ? (
          <Link className="bilingual-action bilingual-action--primary" href={nextHref}>Siguiente lección</Link>
        ) : nextGame ? (
          <button className="bilingual-action bilingual-action--primary" type="button" onClick={onNext}>Siguiente juego</button>
        ) : null}
        <Link className="bilingual-action bilingual-action--secondary" href="/jugador/progress">Ver mi progreso</Link>
        {process.env.NODE_ENV !== "production" && onReplay ? <button className="bilingual-action bilingual-action--secondary" type="button" onClick={onReplay}>Repetir juego</button> : null}
        <Link className="bilingual-text-link" href="/jugador/neurocracks">Volver al recorrido</Link>
      </div>
    </section>
  );
}

export function NextChallenge({ game }: { game: BilingualGameConfig }) {
  const nextGame = getNextBilingualGame(game.id, game.session.targetLanguage);
  return (
    <section className="bilingual-next" aria-labelledby="next-title">
      <p>Siguiente desafío</p>
      {nextGame ? (
        <>
          <h1 id="next-title">{nextGame.label}</h1>
          <strong>{nextGame.mechanicLine}</strong>
          <span>{nextGame.description}</span>
          <Link className="bilingual-action bilingual-action--primary" href={`/neurocracks/bilinguismo/${nextGame.id}`}>Continuar</Link>
        </>
      ) : (
        <>
          <h1 id="next-title">Recorrido completado</h1>
          <strong>Terminaste las tres sesiones de esta vertical slice.</strong>
          <Link className="bilingual-action bilingual-action--primary" href="/jugador/neurocracks">Volver al recorrido</Link>
        </>
      )}
      <Link className="bilingual-text-link" href="/jugador/neurocracks">Ahora no</Link>
    </section>
  );
}
