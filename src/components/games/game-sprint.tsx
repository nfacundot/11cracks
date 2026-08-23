"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordGameScore } from "@/actions/game";
import { BoltIcon } from "@/components/icons";
import { EmoteMascot } from "@/components/emote-mascot";

export type SprintStatement = {
  id: string;
  prompt: string;
  isTrue: boolean;
};

const TIME_PER_QUESTION = 5;

export function GameSprint({ statements }: { statements: SprintStatement[] }) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(TIME_PER_QUESTION);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [finished, setFinished] = useState(false);
  const [resultXp, setResultXp] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [busy, setBusy] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const continueLockRef = useRef(false);
  const pendingScoreRef = useRef(0);
  const statement = statements[qIndex];
  const total = statements.length;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(
    async (finalScore: number) => {
      clearTimer();
      const res = await recordGameScore("QUIZ_SPRINT", finalScore);
      if (res.ok) setResultXp(res.xpGained);
      setFinished(true);
    },
    [clearTimer]
  );

  useEffect(() => {
    if (showIntro || finished) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearTimer();
  }, [showIntro, finished, clearTimer, qIndex]);

  const advance = useCallback(
    (newScore: number) => {
      continueLockRef.current = false;
      const nextIndex = qIndex + 1;
      setSecondsLeft(TIME_PER_QUESTION);
      if (nextIndex >= total) {
        finish(newScore);
      } else {
        setQIndex(nextIndex);
      }
    },
    [qIndex, total, finish]
  );

  const continueToNext = useCallback(
    (newScore: number) => {
      if (continueLockRef.current) return;
      continueLockRef.current = true;
      setFeedback(null);
      advance(newScore);
    },
    [advance]
  );

  useEffect(() => {
    if (secondsLeft > 0 || finished || showIntro || feedback) return;
    const t = setTimeout(() => {
      clearTimer();
      setFeedback("timeout");
      pendingScoreRef.current = score;
    }, 0);
    return () => clearTimeout(t);
  }, [secondsLeft, finished, showIntro, feedback, clearTimer, score]);

  useEffect(() => {
    if (feedback !== "timeout") return;
    advanceTimerRef.current = setTimeout(() => continueToNext(pendingScoreRef.current), 1300);
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [feedback, continueToNext]);

  const answer = (guess: boolean) => {
    if (busy || feedback || !statement) return;
    setBusy(true);
    clearTimer();

    const correct = guess === statement.isTrue;
    const newScore = score + (correct ? 1 : 0);
    if (correct) {
      setScore(newScore);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }

    setBusy(false);
    pendingScoreRef.current = newScore;
    setTimeout(() => continueToNext(newScore), 600);
  };

  const startGame = () => {
    continueLockRef.current = false;
    setQIndex(0);
    setScore(0);
    setFinished(false);
    setFeedback(null);
    setResultXp(0);
    setSecondsLeft(TIME_PER_QUESTION);
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop rounded-full bg-white p-8 text-7xl shadow-lg shadow-green-100 dark:bg-emerald-900 dark:shadow-green-950">⚡</div>
        <div>
          <h1 className="text-2xl font-black">Sprint Express</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {total} afirmaciones · {TIME_PER_QUESTION}s cada una · ¿Verdadero o falso?
          </p>
        </div>
        <button
          onClick={startGame}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
        >
          ¡Al sprint!
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop text-7xl">{score >= total * 0.7 ? "🏃" : "⚽"}</div>
        <div>
          <h1 className="text-2xl font-black">¡Sprint terminado!</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Acertaste {score} de {total} afirmaciones
          </p>
        </div>
        <div className="flex w-full gap-3">
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-green-50 p-4 dark:bg-green-950/40">
            <span className="text-3xl font-black text-green-600 dark:text-green-400">{score}</span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Aciertos</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/40">
            <span className="text-3xl font-black text-orange-500">+{resultXp}</span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">XP</span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={startGame}
            className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
          >
            Correr de nuevo
          </button>
          <Link
            href="/jugador/games"
            className="w-full rounded-2xl border-2 border-green-200 py-3 text-center font-bold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            Más juegos
          </Link>
        </div>
      </div>
    );
  }

  if (!statement) return null;

  const barPct = (secondsLeft / TIME_PER_QUESTION) * 100;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <span>
          Afirmación {Math.min(qIndex + 1, total)}/{total}
        </span>
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <BoltIcon className="h-4 w-4" />
          {score} aciertos
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${secondsLeft > 2 ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div key={qIndex} className="animate-pop flex flex-col gap-4">
        <EmoteMascot
          state={!feedback ? "question" : feedback === "timeout" ? "timeout" : feedback === "correct" ? "correct" : "wrong"}
          text={
            !feedback ? (
              statement.prompt
            ) : feedback === "timeout" ? (
              "¡Tiempo! ⏱️"
            ) : feedback === "correct" ? (
              "¡Correcto! ✅"
            ) : (
              "¡Incorrecto! ❌"
            )
          }
        >
          <button
            disabled={!!feedback}
            onClick={() => answer(true)}
            className="rounded-2xl bg-green-500 py-5 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95 disabled:opacity-60"
          >
            Verdadero
          </button>
          <button
            disabled={!!feedback}
            onClick={() => answer(false)}
            className="rounded-2xl bg-red-500 py-5 text-lg font-black text-white shadow-lg shadow-red-200 transition hover:bg-red-600 active:scale-95 disabled:opacity-60"
          >
            Falso
          </button>
        </EmoteMascot>
        {feedback && (
          <button
            onClick={() => continueToNext(pendingScoreRef.current)}
            className="w-full rounded-2xl bg-green-500 py-3 text-base font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
          >
            Continuar →
          </button>
        )}
      </div>
    </div>
  );
}
