"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { mediaCatalog } from "@/lib/media/catalog";
import type {
  AnswerAttempt,
  BilingualGameConfig,
  BilingualObjective,
  BilingualSessionProgress,
  LetterObjective,
  ListeningObjective,
  MeaningObjective,
} from "@/lib/bilingual/game-contracts";
import {
  beginReview,
  continueAfterFeedback,
  createSessionProgress,
  getReviewObjectiveIds,
  markJourneySession,
  registerAttempt,
  showTransition,
  startSession,
} from "@/lib/bilingual/session-engine";
import { AudioControl } from "./audio-control";
import { GameResult, NextChallenge } from "./game-result";
import { GolMechanic, LetrasMechanic, OidoMechanic } from "./game-mechanics";
import { useBilingualProgress } from "./use-bilingual-progress";
import { submitBilingualGameResult } from "@/app/actions/bilingual";
import { getBilingualGame } from "@/lib/bilingual/demo-content";
import { createOverlayPortal } from "@/components/shared/overlay-portal";
import type { PlayerLearningMissionView } from "@/lib/bilingual/learning-missions";
import type { ContextualPlacement } from "@/lib/activations/contextual";

function GameProgress({ current, total, review }: { current: number; total: number; review: boolean }) {
  const percent = total === 0 ? 0 : Math.min(100, (current / total) * 100);
  return (
    <div className="bilingual-game-progress" aria-label={`${review ? "Repaso" : "Sesión"}: objetivo ${Math.min(current + 1, total)} de ${total}`}>
      <span><strong>{review ? "Repaso" : "Sesión"}</strong><i>{Math.min(current + 1, total)}/{total}</i></span>
      <div><i style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function targetLanguageLabel(targetLanguage: BilingualGameConfig["session"]["targetLanguage"]) {
  return targetLanguage === "pt" ? "Português" : "English";
}

function GameIntro({ game, onStart }: { game: BilingualGameConfig; onStart: () => void }) {
  return (
    <section className="bilingual-game-intro" aria-labelledby="game-intro-title">
      <p>{game.session.environmentLabel} · {game.session.title} · {targetLanguageLabel(game.session.targetLanguage)}</p>
      <h1 id="game-intro-title">{game.label}</h1>
      <strong>{game.mechanicLine}</strong>
      <span>{game.description}</span>
      <div className="bilingual-game-intro__hint">
        <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M5 11h5l6-5v16l-6-5H5zM20 10c1 1 2 2 2 4s-1 3-2 4" /></svg>
        {game.support}
      </div>
      <button className="bilingual-action bilingual-action--primary" type="button" onClick={onStart}>Jugar</button>
    </section>
  );
}

const celebrationPhrases = ["¡BIEN!", "¡ESO ES!", "¡MUY BIEN!", "¡CRACK!", "¡LA TIENES!"] as const;

function celebrationFor(objectiveId: string) {
  const index = [...objectiveId].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return celebrationPhrases[index % celebrationPhrases.length];
}

function GameFeedback({ progress, objectiveId }: { progress: BilingualSessionProgress; objectiveId: string }) {
  if (!progress.feedback || !progress.feedback.correct) return null;
  return (
    <aside className="bilingual-feedback bilingual-feedback--success" data-correct="true" aria-live="polite" aria-atomic="true">
      <span className="bilingual-feedback__celebration">{celebrationFor(objectiveId)}</span>
      <span className="bilingual-feedback__mark" aria-hidden="true">✓</span>
      <div>
        <strong>Objetivo resuelto</strong>
        <p>{progress.feedback.message}</p>
      </div>
    </aside>
  );
}

function TeachingPopup({ objective, gameId, onRetry }: { objective: BilingualObjective; gameId: BilingualGameConfig["id"]; onRetry: () => void }) {
  const retryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { retryRef.current?.focus(); }, []);
  const isLetters = objective.mechanic === "letter-build";
  const correctMeaning = objective.mechanic === "letter-build"
    ? objective.meaning
    : objective.options.find((option) => option.id === objective.correctAnswerId)?.label ?? "";
  return createOverlayPortal(
    <div className="bilingual-feedback-modal__backdrop" role="presentation">
      <section className="bilingual-feedback-modal" role="dialog" aria-modal="true" aria-labelledby="bilingual-feedback-title" aria-describedby="bilingual-feedback-copy" onKeyDown={(event) => { if (event.key === "Tab") { event.preventDefault(); retryRef.current?.focus(); } }}>
        <span className="bilingual-feedback-modal__icon" aria-hidden="true">×</span>
        <span className="bilingual-feedback-modal__eyebrow">{gameId === "gol-de-palabra" ? "Remate detenido" : "Sigue aprendiendo"}</span>
        <h2 id="bilingual-feedback-title">CASI</h2>
        <p id="bilingual-feedback-copy">{isLetters ? <>Escucha otra vez<br />y revisa las letras.</> : <>{objective.target} significa<br /><strong>{correctMeaning}</strong></>}</p>
        <button ref={retryRef} className="bilingual-action bilingual-action--primary" type="button" onClick={onRetry}>Intentar otra vez</button>
      </section>
    </div>,
    document.body,
  );
}

function objectiveAnswerIsCorrect(objective: BilingualObjective, answer: string) {
  return objective.mechanic === "letter-build"
    ? answer === objective.correctOrder
    : answer === objective.correctAnswerId;
}

type GoalOutcome = "goal" | "post" | "wide" | "mannequin" | null;

function resolveGoalOutcome(game: BilingualGameConfig, progress: BilingualSessionProgress): GoalOutcome {
  if (game.id !== "gol-de-palabra" || progress.phase !== "feedback" || !progress.feedback) return null;
  if (progress.feedback.correct) return "goal";
  const index = Math.max(0, game.session.objectives.findIndex((item) => item.id === progress.feedback?.objectiveId));
  return (["post", "mannequin", "wide"] as const)[index % 3];
}

export function GameExperience({ playerId, game, registeredGameId, mission, sponsors = [] }: { playerId: string; game: BilingualGameConfig; registeredGameId?: string; mission?: PlayerLearningMissionView | null; sponsors?: readonly ContextualPlacement[] }) {
  const { journey, saveJourney, resetGame } = useBilingualProgress(playerId);
  const router = useRouter();
  const selectedGame = ["oido-de-crack", "gol-de-palabra", "letras-de-crack"].includes(game.id)
    ? game
    : getBilingualGame(game.id, journey?.targetLanguage ?? game.session.targetLanguage) ?? game;
  const [assisted, setAssisted] = useState(false);
  const [teachingObjectiveId, setTeachingObjectiveId] = useState<string | null>(null);
  const [autoPlayedObjectives, setAutoPlayedObjectives] = useState<ReadonlySet<string>>(() => new Set());
  const [retryNonce, setRetryNonce] = useState(0);
  const [persistenceState, setPersistenceState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lessonReward, setLessonReward] = useState<{ earnedXp: number; perfect: boolean; streak: number } | null>(null);
  const initial = useMemo(() => createSessionProgress(selectedGame.session), [selectedGame]);
  const progress = journey?.sessions[selectedGame.id] ?? initial;
  const reviewIds = getReviewObjectiveIds(progress);
  const reviewObjectiveId = reviewIds[0];
  const objective = progress.phase === "review" || progress.feedback?.mode === "review"
    ? selectedGame.session.objectives.find((item) => item.id === reviewObjectiveId || item.id === progress.feedback?.objectiveId)
    : selectedGame.session.objectives[progress.currentObjectiveIndex];
  const reviewMode = progress.phase === "review" || progress.feedback?.mode === "review";
  const audioObjectiveKey = objective ? `${reviewMode ? "review" : "session"}:${objective.id}` : null;
  const autoPlayObjective = Boolean(
    audioObjectiveKey
    && ["playing", "review"].includes(progress.phase)
    && !autoPlayedObjectives.has(audioObjectiveKey),
  );
  const markAutoPlayAttempt = useCallback(() => {
    if (!audioObjectiveKey) return;
    setAutoPlayedObjectives((current) => current.has(audioObjectiveKey) ? current : new Set([...current, audioObjectiveKey]));
  }, [audioObjectiveKey]);

  const updateProgress = useCallback(async (next: BilingualSessionProgress) => {
    if (!journey) return;
    setPersistenceState("saving");
    try {
      await saveJourney(markJourneySession(journey, next));
      setPersistenceState("saved");
      router.refresh();
    } catch {
      setPersistenceState("error");
    }
  }, [journey, router, saveJourney]);

  const submittedLessonRewardRef = useRef(false);
  useEffect(() => {
    if (progress.phase !== "result") return;
    if (submittedLessonRewardRef.current) return;
    if (persistenceState === "saving" || persistenceState === "error") return;
    if (!journey || !journey.completedGameIds?.includes(selectedGame.id)) return;
    submittedLessonRewardRef.current = true;
    void submitBilingualGameResult({
      gameId: registeredGameId ?? selectedGame.id,
      resolved: progress.resolvedItemCount,
      unresolved: progress.unresolvedItemCount,
    })
      .then((result) => {
        if (result?.ok) {
          setLessonReward({ earnedXp: result.earnedXp, perfect: result.perfect, streak: result.streak });
        }
      })
      .catch(() => {
        submittedLessonRewardRef.current = false;
      });
  }, [progress, persistenceState, journey, selectedGame, registeredGameId]);

  const handleStart = () => updateProgress(startSession(progress));

  const handleAnswer = (answer: string, label: string) => {
    if (!objective || progress.phase === "feedback") return;
    const correct = objectiveAnswerIsCorrect(objective, answer);
    const attempt: AnswerAttempt = {
      objectiveId: objective.id,
      answer,
      correct,
      assisted,
      mode: reviewMode ? "review" : "session",
    };
    const message = correct ? objective.feedback.correct : objective.feedback.incorrect;
    updateProgress(registerAttempt(progress, attempt, message, label, selectedGame.session.objectives.length));
  };

  const handleContinue = useCallback(() => {
    setAssisted(false);
    updateProgress(continueAfterFeedback(progress, selectedGame.session));
  }, [selectedGame.session, progress, updateProgress]);

  const handleRetry = useCallback(() => {
    setTeachingObjectiveId(null);
    setRetryNonce((current) => current + 1);
    if (audioObjectiveKey) {
      setAutoPlayedObjectives((current) => {
        if (!current.has(audioObjectiveKey)) return current;
        const next = new Set(current);
        next.delete(audioObjectiveKey);
        return next;
      });
    }
    setAssisted(false);
    handleContinue();
  }, [audioObjectiveKey, handleContinue]);

  useEffect(() => {
    if (progress.phase !== "feedback" || !progress.feedback?.correct) return;
    const delay = selectedGame.id === "gol-de-palabra" ? 2050 : 1050;
    const timer = window.setTimeout(handleContinue, delay);
    return () => window.clearTimeout(timer);
  }, [selectedGame.id, handleContinue, progress.feedback?.correct, progress.feedback?.objectiveId, progress.phase]);

  useEffect(() => {
    if (progress.phase !== "feedback" || !progress.feedback || progress.feedback.correct) {
      return;
    }
    const delay = selectedGame.id === "gol-de-palabra" ? 850 : 0;
    const timer = window.setTimeout(() => setTeachingObjectiveId(progress.feedback?.objectiveId ?? null), delay);
    return () => window.clearTimeout(timer);
  }, [selectedGame.id, progress.feedback, progress.phase]);

  useEffect(() => {
    if (progress.phase !== "result" || persistenceState !== "idle") return;
    const timer = window.setTimeout(() => { void updateProgress(progress); }, 0);
    return () => window.clearTimeout(timer);
  }, [persistenceState, progress, updateProgress]);

  const handleReplay = () => {
    setAssisted(false);
    setAutoPlayedObjectives(new Set());
    resetGame(selectedGame.session);
  };

  if (!journey) {
    return <div className="bilingual-game bilingual-game--loading"><span>Cargando sesión…</span></div>;
  }

  const reviewIndex = reviewMode
    ? Math.max(0, progress.reviewObjectiveIds.findIndex((id) => id === objective?.id))
    : progress.currentObjectiveIndex;
  const progressTotal = reviewMode ? progress.reviewObjectiveIds.length : selectedGame.session.objectives.length;
  const logo = mediaCatalog.official11CracksLogo;
  const goalOutcome = resolveGoalOutcome(selectedGame, progress);
  const sceneCrops = selectedGame.session.scene.crops;
  const sceneStyle = {
    "--bilingual-scene-desktop": sceneCrops?.desktop ?? selectedGame.session.scene.focalPoint,
    "--bilingual-scene-tablet": sceneCrops?.tablet ?? selectedGame.session.scene.focalPoint,
    "--bilingual-scene-mobile": sceneCrops?.mobile ?? selectedGame.session.scene.focalPoint,
  } as CSSProperties;

  return (
    <article
      className="bilingual-game"
      data-accent={selectedGame.accent}
      data-phase={progress.phase}
      data-game-id={selectedGame.id}
      data-safe-interaction-area={selectedGame.session.scene.safeInteractionArea}
      data-protected-visual-area={selectedGame.session.scene.protectedVisualArea}
      style={sceneStyle}
    >
      {selectedGame.session.scene.mobileSrc ? (
        <Image
          className="bilingual-game__scene bilingual-game__scene--mobile"
          src={selectedGame.session.scene.mobileSrc}
          alt=""
          fill
          priority
          sizes="(max-width: 767px) 100vw, 0vw"
        />
      ) : null}
      <Image
        className={`bilingual-game__scene${selectedGame.session.scene.mobileSrc ? " bilingual-game__scene--desktop" : ""}`}
        src={selectedGame.session.scene.src}
        alt={selectedGame.session.scene.alt}
        fill
        priority
        sizes="(max-width: 767px) 0vw, 100vw"
      />
      <div className="bilingual-game__grade" aria-hidden="true" />
      <header className="bilingual-game__hud">
        <Link href="/jugador/neurocracks" className="bilingual-game__brand" aria-label="Volver a El Camino">
          <Image src={logo.src} alt={logo.alt} width={logo.dimensions.width} height={logo.dimensions.height} priority />
          <span>El Camino</span>
        </Link>
        {progress.phase !== "intro" && progress.phase !== "result" && progress.phase !== "transition" ? (
          <GameProgress current={reviewIndex} total={progressTotal} review={reviewMode} />
        ) : <span />}
        <Link href="/jugador/neurocracks" className="bilingual-game__exit" aria-label="Salir y guardar progreso"><span>Salir</span><i aria-hidden="true">×</i></Link>
      </header>

      <main className="bilingual-game__main">
        {progress.phase === "intro" ? <GameIntro game={selectedGame} onStart={handleStart} /> : null}
        {progress.phase === "result" && persistenceState === "saving" ? <section className="bilingual-save-state" aria-live="polite" aria-busy="true" aria-labelledby="bilingual-save-title"><div className="bilingual-save-state__panel"><span className="bilingual-save-state__eyebrow">PROGRESIÓN · GUARDADO</span><h1 id="bilingual-save-title">Guardando tu avance</h1><p>Verificando tu misión…</p><div className="bilingual-save-state__progress" role="status" aria-label="Guardando tu avance"><span /></div></div></section> : null}
        {progress.phase === "result" && persistenceState === "error" ? <section className="bilingual-result bilingual-result--saving" role="alert"><h1>No pudimos guardar todavía</h1><p>Tu avance está en este dispositivo. Reintenta para confirmar la finalización.</p><button className="bilingual-action bilingual-action--primary" type="button" onClick={() => updateProgress(progress)}>Reintentar guardado</button></section> : null}
        {progress.phase === "result" && persistenceState !== "saving" && persistenceState !== "error" ? (
          <GameResult game={selectedGame} progress={progress} mission={mission} reward={lessonReward} onReview={() => updateProgress(beginReview(progress))} onNext={() => updateProgress(showTransition(progress))} onReplay={handleReplay} />
        ) : null}
        {persistenceState === "error" && progress.phase !== "result" ? <p role="alert" className="bilingual-persistence-error">No pudimos guardar este avance. Revisa tu conexión e inténtalo de nuevo.</p> : null}
        {progress.phase === "transition" ? <NextChallenge game={selectedGame} /> : null}
        {(progress.phase === "playing" || progress.phase === "review" || progress.phase === "feedback") && objective ? (
          <section className="bilingual-challenge" aria-labelledby="challenge-title">
            <header className="bilingual-challenge__prompt">
              <p>{reviewMode ? "Refuerza este objetivo" : selectedGame.session.environmentLabel} · {targetLanguageLabel(selectedGame.session.targetLanguage)}</p>
              <h1 id="challenge-title">{objective.mechanic === "letter-build" ? "Construye la palabra" : selectedGame.id === "gol-de-palabra" ? "¿Qué significa?" : "¿Qué escuchaste?"}</h1>
              <AudioControl
                audio={objective.audio}
                autoPlay={autoPlayObjective}
                onAutoPlayAttempt={markAutoPlayAttempt}
                onPlayed={() => objective.mechanic === "letter-build" && setAssisted(true)}
              />
            </header>
            <div className="bilingual-challenge__play" key={`${objective.id}-${retryNonce}`}>
              {objective.mechanic === "visual-choice" ? (
                <OidoMechanic
                  objective={objective as ListeningObjective}
                  disabled={progress.phase === "feedback"}
                  feedback={progress.feedback}
                  onAnswer={handleAnswer}
                  sponsors={sponsors}
                />
              ) : null}
              {objective.mechanic === "meaning-choice" ? (
                <GolMechanic objective={objective as MeaningObjective} disabled={progress.phase === "feedback"} feedback={progress.feedback} outcome={goalOutcome} onAnswer={handleAnswer} sponsors={sponsors} />
              ) : null}
              {objective.mechanic === "letter-build" ? (
                <LetrasMechanic objective={objective as LetterObjective} disabled={progress.phase === "feedback"} feedback={progress.feedback} onAnswer={handleAnswer} sponsors={sponsors} />
              ) : null}
            </div>
            {selectedGame.id !== "gol-de-palabra" ? <GameFeedback progress={progress} objectiveId={objective.id} /> : null}
            {progress.phase === "feedback" && progress.feedback && !progress.feedback.correct && teachingObjectiveId === progress.feedback.objectiveId ? (
              <TeachingPopup objective={objective} gameId={selectedGame.id} onRetry={handleRetry} />
            ) : null}
          </section>
        ) : null}
      </main>
    </article>
  );
}
