"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordGameScore } from "@/actions/game";
import { BallIcon } from "@/components/icons";

export type PenaltyQuestion = {
  id: string;
  prompt: string;
  correctOptionId: string;
  options: { id: string; text: string }[];
};

const TIME_PER_QUESTION = 8;

export function GamePenalty({ questions }: { questions: PenaltyQuestion[] }) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<"goal" | "miss" | "timeout" | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIME_PER_QUESTION);
  const [finished, setFinished] = useState(false);
  const [resultXp, setResultXp] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [busy, setBusy] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const question = questions[qIndex];
  const total = questions.length;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(
    async (finalScore: number) => {
      clearTimer();
      const res = await recordGameScore("PENALTY_SHOOTOUT", finalScore);
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
  }, [showIntro, finished, clearTimer]);

  const advance = useCallback(
    (newScore: number) => {
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

  useEffect(() => {
    if (secondsLeft > 0 || finished || showIntro || result) return;
    const t = setTimeout(() => {
      clearTimer();
      setResult("timeout");
      advance(score);
    }, 0);
    return () => clearTimeout(t);
  }, [secondsLeft, finished, showIntro, result, clearTimer, advance, score]);

  const answer = async (optionId: string) => {
    if (busy || result) return;
    setBusy(true);
    clearTimer();

    const correct = optionId === question.correctOptionId;
    const newScore = score + (correct ? 1 : 0);

    if (correct) {
      setScore(newScore);
      setResult("goal");
    } else {
      setResult("miss");
    }

    setBusy(false);
    setTimeout(() => {
      setResult(null);
      advance(newScore);
    }, 900);
  };

  const startGame = () => {
    setQIndex(0);
    setScore(0);
    setFinished(false);
    setResult(null);
    setResultXp(0);
    setSecondsLeft(TIME_PER_QUESTION);
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop rounded-full bg-white p-8 text-7xl shadow-lg shadow-green-100">🥅</div>
        <div>
          <h1 className="text-2xl font-black">Tanda de Penales</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {total} disparos · {TIME_PER_QUESTION}s por disparo · Acerta para anotar
          </p>
        </div>
        <button
          onClick={startGame}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
        >
          ¡Comenzar la tanda!
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop text-7xl">{score > total / 2 ? "🏆" : "⚽"}</div>
        <div>
          <h1 className="text-2xl font-black">¡Tanda finalizada!</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Anotaste {score} de {total} penales
          </p>
        </div>
        <div className="flex w-full gap-3">
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-green-50 p-4">
            <span className="text-3xl font-black text-green-600">{score}</span>
            <span className="text-xs font-bold text-zinc-500">Goles</span>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-orange-50 p-4">
            <span className="text-3xl font-black text-orange-500">+{resultXp}</span>
            <span className="text-xs font-bold text-zinc-500">XP</span>
          </div>
        </div>
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={startGame}
            className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
          >
            Jugar de nuevo
          </button>
          <Link
            href="/games"
            className="w-full rounded-2xl border-2 border-green-200 py-3 text-center font-bold text-green-700 transition hover:bg-green-50"
          >
            Más juegos
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const barPct = (secondsLeft / TIME_PER_QUESTION) * 100;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
        <span>
          Disparo {Math.min(qIndex + 1, total)}/{total}
        </span>
        <span className="flex items-center gap-1 text-green-600">
          <BallIcon className="h-4 w-4" />
          {score} goles
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${secondsLeft > 3 ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div key={qIndex} className="animate-pop flex flex-col gap-5 pt-2">
        <h2 className="text-xl font-black leading-snug">{question.prompt}</h2>

        {result === "goal" && (
          <div className="animate-pop rounded-2xl bg-green-50 p-4 text-center text-2xl font-black text-green-600">
            ¡GOOOL! ⚽
          </div>
        )}
        {result === "miss" && (
          <div className="animate-pop rounded-2xl bg-red-50 p-4 text-center text-2xl font-black text-red-500">
            ¡Fallaste! 😵
          </div>
        )}
        {result === "timeout" && (
          <div className="animate-pop rounded-2xl bg-red-50 p-4 text-center text-2xl font-black text-red-500">
            ¡Fuera de tiempo! ⏱️
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, i) => (
            <button
              key={option.id}
              disabled={!!result}
              onClick={() => answer(option.id)}
              className="flex items-center gap-3 rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3.5 text-left font-semibold text-zinc-700 transition hover:border-green-300 hover:bg-green-50 active:scale-95 disabled:opacity-60"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-black text-zinc-500">
                {["A", "B", "C", "D"][i] ?? i + 1}
              </span>
              {option.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
