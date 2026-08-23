"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordGameScore } from "@/actions/game";
import { BallIcon, XIcon } from "@/components/icons";
import type { CSSProperties } from "react";
import { EmoteMascot } from "@/components/emote-mascot";

export type PenaltyQuestion = {
  id: string;
  prompt: string;
  correctOptionId: string;
  options: { id: string; text: string }[];
};

const TIME_PER_QUESTION = 8;

const goalSetup = () => {
  const right = Math.random() > 0.5;
  return right
    ? { kickX: "70px", diveX: "-80px" }
    : { kickX: "-70px", diveX: "80px" };
};

const missSetup = () => ({ kickX: "0px", diveX: "0px" });

export function GamePenalty({ questions }: { questions: PenaltyQuestion[] }) {
  const shotsCount = Math.min(5, questions.length);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState<("pending" | "goal" | "miss")[]>(
    Array.from({ length: shotsCount }, () => "pending")
  );
  const [result, setResult] = useState<"goal" | "miss" | "timeout" | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIME_PER_QUESTION);
  const [finished, setFinished] = useState(false);
  const [resultXp, setResultXp] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [busy, setBusy] = useState(false);
  const [kickX, setKickX] = useState("0px");
  const [diveX, setDiveX] = useState("70px");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const continueLockRef = useRef(false);
  const pendingScoreRef = useRef(0);
  const question = questions[qIndex];

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
  }, [showIntro, finished, clearTimer, qIndex]);

  const advance = useCallback(
    (newScore: number) => {
      continueLockRef.current = false;
      const nextIndex = qIndex + 1;
      setSecondsLeft(TIME_PER_QUESTION);
      if (nextIndex >= shotsCount) {
        finish(newScore);
      } else {
        setQIndex(nextIndex);
      }
    },
    [qIndex, shotsCount, finish]
  );

  const continueToNext = useCallback(
    (newScore: number) => {
      if (continueLockRef.current) return;
      continueLockRef.current = true;
      setResult(null);
      advance(newScore);
    },
    [advance]
  );

  useEffect(() => {
    if (secondsLeft > 0 || finished || showIntro || result) return;
    const t = setTimeout(() => {
      clearTimer();
      setResult("timeout");
      const m = missSetup();
      setKickX(m.kickX);
      setDiveX(m.diveX);
      setShots((prev) => prev.map((s, i) => (i === qIndex ? "miss" : s)));
      pendingScoreRef.current = score;
    }, 0);
    return () => clearTimeout(t);
  }, [secondsLeft, finished, showIntro, result, clearTimer, qIndex, score]);

  useEffect(() => {
    if (result !== "timeout") return;
    advanceTimerRef.current = setTimeout(() => continueToNext(score), 1300);
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [result, continueToNext, score]);

  const answer = async (optionId: string) => {
    if (busy || result) return;
    setBusy(true);
    clearTimer();

    const correct = optionId === question.correctOptionId;
    const newScore = score + (correct ? 1 : 0);

    if (correct) {
      setScore(newScore);
      setResult("goal");
      const setup = goalSetup();
      setKickX(setup.kickX);
      setDiveX(setup.diveX);
      setShots((prev) => prev.map((s, i) => (i === qIndex ? "goal" : s)));
    } else {
      setResult("miss");
      const m = missSetup();
      setKickX(m.kickX);
      setDiveX(m.diveX);
      setShots((prev) => prev.map((s, i) => (i === qIndex ? "miss" : s)));
    }

    setBusy(false);
    pendingScoreRef.current = newScore;
    setTimeout(() => continueToNext(newScore), 1300);
  };

  const startGame = () => {
    continueLockRef.current = false;
    setQIndex(0);
    setScore(0);
    setShots(Array.from({ length: shotsCount }, () => "pending"));
    setFinished(false);
    setResult(null);
    setResultXp(0);
    setSecondsLeft(TIME_PER_QUESTION);
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop rounded-full bg-white p-8 text-7xl shadow-lg shadow-green-100 dark:bg-emerald-900 dark:shadow-green-950">🥅</div>
        <div>
          <h1 className="text-2xl font-black">Tanda de Penales</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {shotsCount} disparos · {TIME_PER_QUESTION}s por disparo · Responde bien para anotar
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
        <div className="animate-pop text-7xl">{score > shotsCount / 2 ? "🏆" : "⚽"}</div>
        <div>
          <h1 className="text-2xl font-black">¡Tanda finalizada!</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Anotaste {score} de {shotsCount} penales
          </p>
        </div>
        <div className="flex w-full gap-3">
          <div className="flex flex-1 flex-col items-center rounded-2xl bg-green-50 p-4 dark:bg-green-950/40">
            <span className="text-3xl font-black text-green-600 dark:text-green-400">{score}</span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Goles</span>
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
            Jugar de nuevo
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

  if (!question) return null;

  const barPct = (secondsLeft / TIME_PER_QUESTION) * 100;
  const kickStyle = result ? ({ "--kick-x": kickX } as CSSProperties) : undefined;
  const diveStyle = result ? ({ "--dive-x": diveX } as CSSProperties) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <span>
          Disparo {Math.min(qIndex + 1, shotsCount)}/{shotsCount}
        </span>
        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <BallIcon className="h-4 w-4" />
          {score} goles
        </span>
      </div>

      <div className="flex justify-center gap-2">
        {shots.map((s, i) => (
          <div
            key={i}
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white transition dark:bg-emerald-900 ${
              s === "goal"
                ? "border-green-500 dark:border-green-500"
                : s === "miss"
                  ? "border-red-500 dark:border-red-500"
                  : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            {s === "goal" && <BallIcon className="h-7 w-7 animate-pop text-green-600 dark:text-green-400" />}
            {s === "miss" && <XIcon className="h-7 w-7 animate-pop text-red-500" />}
            {s === "pending" && <BallIcon className="h-7 w-7 text-zinc-300 opacity-40 dark:text-zinc-600" />}
          </div>
        ))}
      </div>

      <div className="relative h-56 overflow-hidden rounded-3xl bg-gradient-to-b from-green-700 via-green-800 to-emerald-950 shadow-inner ring-1 ring-green-100 dark:ring-green-900">
        <div className="absolute left-1/2 top-4 h-28 w-64 -translate-x-1/2 overflow-hidden rounded-b-2xl border-2 border-white/80 bg-white/10 dark:bg-white/5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
            backgroundSize: "12px 12px",
          }}
        >
          {result === "miss" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <XIcon className="h-16 w-16 animate-pop text-red-500" />
            </div>
          )}
          {result === "timeout" && (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">⏱️</div>
          )}
        </div>

        <div
          className={`absolute left-1/2 top-[74px] -translate-x-1/2 ${
            result === "goal" ? "animate-keeper-dive" : ""
          }`}
          style={diveStyle}
        >
          <div className="flex flex-col items-center">
            <div className="h-4 w-4 rounded-full bg-amber-200" />
            <div className="h-9 w-10 rounded-t-2xl bg-yellow-400 shadow-md" />
            <div className="flex w-14 justify-between">
              <div className="h-3 w-3 rounded-full bg-white shadow" />
              <div className="h-3 w-3 rounded-full bg-white shadow" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-full bg-white/50" />

        <div
          className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 text-4xl drop-shadow-lg ${
            result ? "animate-kick-ball" : ""
          }`}
          style={kickStyle}
        >
          ⚽
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${secondsLeft > 3 ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div key={qIndex} className="animate-pop flex flex-col gap-4">
        <EmoteMascot
          state={!result ? "question" : result === "timeout" ? "timeout" : result === "goal" ? "correct" : "wrong"}
          text={
            !result ? (
              question.prompt
            ) : result === "timeout" ? (
              "¡Fuera de tiempo! ⏱️"
            ) : result === "goal" ? (
              "¡GOOOOL! 🥅"
            ) : (
              "¡Atajado! 🧤"
            )
          }
        >
          {question.options.map((option, i) => (
            <button
              key={option.id}
              disabled={!!result}
              onClick={() => answer(option.id)}
              className="flex items-center gap-2 rounded-2xl border-2 border-zinc-200 bg-white px-3 py-3 text-left font-semibold text-zinc-700 transition hover:border-green-300 hover:bg-green-50 active:scale-95 disabled:opacity-60 dark:border-zinc-700 dark:bg-emerald-900 dark:text-zinc-100 dark:hover:border-green-600 dark:hover:bg-green-950/50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                {["A", "B", "C", "D"][i] ?? i + 1}
              </span>
              {option.text}
            </button>
          ))}
        </EmoteMascot>
        {result && (
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
