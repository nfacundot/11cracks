"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { GameFeedbackState, LetterObjective, ListeningObjective, MeaningObjective } from "@/lib/bilingual/game-contracts";
import type { ContextualPlacement } from "@/lib/activations/contextual";
import { getContextualSurface, getContextualSurfaceLabel } from "@/lib/activations/presentation";

function ContextualPlacements({ sponsors, className = "" }: { sponsors: readonly ContextualPlacement[]; className?: string }) {
  if (!sponsors.length) return null;
  return <div className={`bilingual-contextual-sponsors ${className}`} aria-label="Contenido contextual demo">
    {sponsors.map((sponsor) => {
      const surface = getContextualSurface(sponsor.placement);
      return <span className={`bilingual-contextual-sponsors__surface bilingual-contextual-sponsors__surface--${surface}`} data-placement={sponsor.placement} data-surface={surface} key={`${sponsor.activationId}-${sponsor.placement}`}>
        <span className="bilingual-contextual-sponsors__creative" title={sponsor.campaignName}>
          <small>{getContextualSurfaceLabel(surface)}</small>
          <b>{sponsor.brandName}</b>
          {sponsor.demoOnly ? <em>DEMO</em> : null}
        </span>
      </span>;
    })}
  </div>;
}

export function OidoMechanic({
  objective,
  disabled,
  feedback,
  onAnswer,
  sponsors = [],
}: {
  objective: ListeningObjective;
  disabled: boolean;
  feedback: GameFeedbackState | null;
  onAnswer: (answer: string, label: string) => void;
  sponsors?: readonly ContextualPlacement[];
}) {
  const activeFeedback = feedback?.objectiveId === objective.id ? feedback : null;
  return (
    <div className="bilingual-oido-stage">
      <ContextualPlacements sponsors={sponsors} className="bilingual-contextual-sponsors--locker" />
      <p id="oido-object-instruction">Elige el objeto que escuchaste</p>
      <div className="bilingual-visual-options" role="group" aria-labelledby="oido-object-instruction">
        {objective.options.map((option) => {
          const isCorrectObject = option.id === objective.correctAnswerId;
          const isSelectedObject = activeFeedback?.answerLabel === option.label;
          const state = activeFeedback
            ? isCorrectObject ? "answer" : isSelectedObject ? "incorrect" : "idle"
            : "ready";
          const revealId = isCorrectObject && activeFeedback ? `${objective.id}-answer-reveal` : undefined;
          const indicator = activeFeedback && (isCorrectObject || isSelectedObject)
            ? isCorrectObject ? "correct" : "incorrect"
            : null;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              data-state={state}
              data-outcome={isCorrectObject && activeFeedback?.correct ? "correct" : undefined}
              onClick={() => onAnswer(option.id, option.label)}
              aria-label={activeFeedback && isCorrectObject
                ? `${option.asset.alt}. Respuesta correcta: ${objective.target}, ${option.label}`
                : activeFeedback && isSelectedObject
                  ? `${option.asset.alt}. Selección incorrecta`
                  : `Objeto visual: ${option.asset.alt}`}
              aria-describedby={revealId}
            >
              <span className="bilingual-visual-options__asset">
                <Image
                  src={option.asset.src}
                  alt=""
                  width={option.asset.width}
                  height={option.asset.height}
                  sizes="(max-width: 767px) 42vw, (max-width: 1023px) 28vw, 16vw"
                />
              </span>
              {indicator ? (
                <span className="bilingual-visual-options__indicator" data-kind={indicator} aria-hidden="true">
                  {indicator === "correct" ? (
                    <svg viewBox="0 0 24 24"><path d="m5 12.5 4.2 4.2L19 7" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24"><path d="m7 7 10 10M17 7 7 17" /></svg>
                  )}
                </span>
              ) : null}
              {isCorrectObject && activeFeedback ? (
                <span className="bilingual-visual-options__reveal" id={revealId}>
                  <strong>{objective.target}</strong>
                  <span>{option.label}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GolMechanic({ objective, disabled, feedback, outcome, onAnswer, sponsors = [] }: { objective: MeaningObjective; disabled: boolean; feedback: GameFeedbackState | null; outcome: "goal" | "post" | "wide" | "mannequin" | null; onAnswer: (answer: string, label: string) => void; sponsors?: readonly ContextualPlacement[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const activeFeedback = feedback?.objectiveId === objective.id ? feedback : null;
  const correctOption = objective.options.find((option) => option.id === objective.correctAnswerId);
  return (
    <div className="bilingual-goal-play" data-outcome={outcome ?? "ready"}>
      <div className="bilingual-goal-play__pitch" aria-hidden="true">
        <ContextualPlacements sponsors={sponsors} className="bilingual-contextual-sponsors--goal" />
        <span className="bilingual-goal-play__lane" />
        <span className="bilingual-goal-play__impact" data-outcome={outcome ?? "ready"} />
        <span className="bilingual-goal-play__ball-shadow" />
        <span className="bilingual-goal-play__ball">
          <Image src="/game-assets/bilinguisimo/gol/football-realistic-v1.png" alt="" width={160} height={160} sizes="(max-width: 767px) 3.5rem, 4.8rem" />
        </span>
      </div>
      {activeFeedback ? (
        <div className="bilingual-goal-play__shot-feedback" data-outcome={outcome} aria-hidden="true">
          <strong>{outcome === "goal" ? "¡GOL!" : "CASI"}</strong>
          <span>{objective.target} · {correctOption?.label}</span>
        </div>
      ) : null}
      <fieldset className="bilingual-meaning-options" disabled={disabled}>
        <legend>Selecciona el significado</legend>
        {objective.options.map((option) => (
          <button
            key={option.id}
            type="button"
            data-selected={selected === option.id || activeFeedback?.answerLabel === option.label}
            data-answer-state={activeFeedback ? option.id === objective.correctAnswerId ? "correct" : activeFeedback.answerLabel === option.label ? "incorrect" : "idle" : "ready"}
            aria-label={`Significado: ${option.label}`}
            onClick={() => { setSelected(option.id); onAnswer(option.id, option.label); }}
          >
            <span>{option.label}</span><i aria-hidden="true">→</i>
          </button>
        ))}
      </fieldset>
    </div>
  );
}

export function LetrasMechanic({ objective, disabled, feedback, onAnswer, sponsors = [] }: { objective: LetterObjective; disabled: boolean; feedback: GameFeedbackState | null; onAnswer: (answer: string, label: string) => void; sponsors?: readonly ContextualPlacement[] }) {
  const tiles = useMemo(() => objective.availableLetters.map((letter, index) => ({ id: `${letter}-${index}`, letter })), [objective]);
  const [picked, setPicked] = useState<string[]>([]);
  const word = picked.map((id) => tiles.find((tile) => tile.id === id)?.letter ?? "").join("");

  return (
    <div className="bilingual-letter-play">
      <ContextualPlacements sponsors={sponsors} className="bilingual-contextual-sponsors--food" />
      <div className="bilingual-letter-play__target">
        <Image
          src={objective.visualAsset.src}
          alt={objective.visualAsset.alt}
          width={objective.visualAsset.width}
          height={objective.visualAsset.height}
          priority
          sizes="(max-width: 767px) 52vw, 22rem"
        />
        <p>{objective.prompt}</p>
      </div>
      <div className="bilingual-letter-slots" aria-label={`Palabra construida: ${word || "vacía"}`}>
        {Array.from({ length: objective.correctOrder.length }, (_, index) => {
          const tileId = picked[index];
          const tile = tiles.find((item) => item.id === tileId);
          return (
            <button
              key={index}
              type="button"
              disabled={disabled || !tile}
              onClick={() => tile && setPicked((current) => current.filter((id) => id !== tile.id))}
              aria-label={tile ? `Quitar letra ${tile.letter} de la posición ${index + 1}` : `Posición ${index + 1} vacía`}
            >{tile?.letter ?? ""}</button>
          );
        })}
      </div>
      <div className="bilingual-letter-bank" aria-label="Letras disponibles">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            data-used={picked.includes(tile.id) ? "true" : "false"}
            disabled={disabled || picked.includes(tile.id) || picked.length >= objective.correctOrder.length}
            onClick={() => setPicked((current) => [...current, tile.id])}
            aria-label={`Añadir letra ${tile.letter}`}
          >{tile.letter}</button>
        ))}
      </div>
      <button
        className="bilingual-action bilingual-action--primary bilingual-letter-play__check"
        type="button"
        disabled={disabled || picked.length !== objective.correctOrder.length}
        onClick={() => onAnswer(word, word)}
      >Comprobar palabra</button>
      {feedback?.objectiveId === objective.id && feedback.correct ? (
        <div className="bilingual-letter-play__reveal" aria-live="polite"><strong>{objective.target}</strong><span>{objective.meaning}</span></div>
      ) : null}
    </div>
  );
}
