"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { recordGameScore } from "@/actions/game";
import { EmoteMascot, type EmoteState } from "@/components/emote-mascot";

export type InfogramaOption = { id: string; text: string; imageUrl: string };
export type InfogramaQuestion = {
  id: string;
  prompt: string;
  explanation?: string | null;
  correctOptionId: string;
  options: InfogramaOption[];
};

const LETTERS = ["A", "B", "C", "D"];
const TIME_PER_QUESTION = 20;
const MAX_QUESTIONS = 8;

export function GameInfograma({ questions }: { questions: InfogramaQuestion[] }) {
  const questionCount = Math.min(MAX_QUESTIONS, questions.length);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [resultXp, setResultXp] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(TIME_PER_QUESTION);
  const pendingScoreRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const question = questions[qIndex];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(async (finalScore: number) => {
    clearTimer();
    const res = await recordGameScore("INFOGRAMA", finalScore);
    if (res.ok) setResultXp(res.xpGained);
    setFinished(true);
  }, [clearTimer]);

  useEffect(() => {
    if (showIntro || finished) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearTimer();
  }, [showIntro, finished, clearTimer, qIndex]);

  useEffect(() => {
    if (secondsLeft > 0 || finished || showIntro || picked) return;
    const t = setTimeout(() => {
      clearTimer();
      setPicked("__timeout__");
    }, 0);
    return () => clearTimeout(t);
  }, [secondsLeft, finished, showIntro, picked, clearTimer]);

  const pick = (optionId: string) => {
    if (picked) return;
    const correct = optionId === question.correctOptionId;
    const newScore = score + (correct ? 1 : 0);
    setScore(newScore);
    pendingScoreRef.current = newScore;
    setPicked(optionId);
  };

  const next = () => {
    const newScore = pendingScoreRef.current;
    const nextIndex = qIndex + 1;
    setPicked(null);
    setSecondsLeft(TIME_PER_QUESTION);
    if (nextIndex >= questionCount) {
      finish(newScore);
    } else {
      setQIndex(nextIndex);
    }
  };

  const startGame = () => {
    setQIndex(0);
    setScore(0);
    setPicked(null);
    setResultXp(0);
    pendingScoreRef.current = 0;
    setSecondsLeft(TIME_PER_QUESTION);
    setFinished(false);
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop rounded-full bg-white p-8 text-7xl shadow-lg shadow-green-100 dark:bg-emerald-900 dark:shadow-green-950">
          🖼️
        </div>
        <div>
          <h1 className="text-2xl font-black">Infograma</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {questionCount} preguntas · {TIME_PER_QUESTION}s por pregunta · Elegí la opción
            correcta entre 4 imágenes
          </p>
        </div>
        <button
          onClick={startGame}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
        >
          ¡Comenzar!
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop text-7xl">{score > questionCount / 2 ? "🏆" : "🎯"}</div>
        <div>
          <h1 className="text-2xl font-black">¡Partida terminada!</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Acertaste {score} de {questionCount} preguntas
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
            Jugar de nuevo
          </button>
          <Link
            href="/games"
            className="w-full rounded-2xl border-2 border-green-200 py-3 text-center font-bold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            Más juegos
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const timedOut = picked === "__timeout__";
  const feedback: EmoteState = !picked
    ? "question"
    : timedOut
      ? "timeout"
      : picked === question.correctOptionId
        ? "correct"
        : "wrong";

  const feedbackText = !picked
    ? question.prompt
    : timedOut
      ? "¡Fuera de tiempo! ⏱️"
      : picked === question.correctOptionId
        ? "¡Correcto! 🎉"
        : "¡Casi! Esa no era";

  const barPct = (secondsLeft / TIME_PER_QUESTION) * 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <span>
          Pregunta {Math.min(qIndex + 1, questionCount)}/{questionCount}
        </span>
        <span className="text-green-600 dark:text-green-400">✅ {score} aciertos</span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            secondsLeft > 5 ? "bg-green-500" : "bg-red-500"
          }`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      <div key={qIndex} className="animate-pop flex flex-col gap-4">
        <EmoteMascot
          state={feedback}
          text={feedbackText}
          explanation={
            picked && !timedOut && question.explanation ? question.explanation : undefined
          }
        >
          {question.options.map((opt, i) => {
            const isCorrectOption = opt.id === question.correctOptionId;
            const isPicked = opt.id === picked;
            let ring = "border-zinc-200 dark:border-zinc-700";
            let badge = "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300";
            if (picked) {
              if (isCorrectOption) {
                ring = "border-green-500 dark:border-green-500";
                badge = "bg-green-500 text-white";
              } else if (isPicked) {
                ring = "border-red-500 dark:border-red-500";
                badge = "bg-red-500 text-white";
              } else {
                ring = "border-zinc-200 opacity-50 dark:border-zinc-700";
              }
            }
            return (
              <button
                key={opt.id}
                disabled={!!picked}
                onClick={() => pick(opt.id)}
                className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-white text-left transition active:scale-95 disabled:active:scale-100 dark:bg-emerald-900 ${ring} ${
                  picked ? "" : "hover:border-green-300 hover:bg-green-50 dark:hover:border-green-600 dark:hover:bg-green-950/50"
                }`}
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={opt.imageUrl}
                    alt={opt.text}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-md ${badge}`}
                  >
                    {LETTERS[i] ?? i + 1}
                  </span>
                  {picked && isCorrectOption && (
                    <span className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white drop-shadow-lg">
                      ✓
                    </span>
                  )}
                  {picked && isPicked && !isCorrectOption && (
                    <span className="absolute inset-0 flex items-center justify-center text-5xl font-black text-white drop-shadow-lg">
                      ✗
                    </span>
                  )}
                </div>
                <span className="px-3 py-2.5 text-sm font-black leading-tight text-emerald-950 dark:text-white">
                  {opt.text}
                </span>
              </button>
            );
          })}
        </EmoteMascot>
        {picked && (
          <button
            onClick={next}
            className="w-full rounded-2xl bg-green-500 py-3 text-base font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
          >
            {qIndex + 1 >= questionCount ? "Ver resultado" : "Continuar →"}
          </button>
        )}
      </div>
    </div>
  );
}
