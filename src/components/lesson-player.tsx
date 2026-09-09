"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { submitAnswer, finishLesson } from "@/actions/lesson";
import { CheckIcon, HeartIcon, XIcon, FlameIcon, BoltIcon, ArrowLeftIcon } from "@/components/icons";
import { EmoteMascot } from "@/components/emote-mascot";

export type PlayerQuestion = {
  id: string;
  type: string;
  prompt: string;
  explanation?: string | null;
  timeSeconds?: number | null;
  options: { id: string; text: string; imageUrl?: string | null }[];
};

export type PlayerLesson = {
  id: string;
  title: string;
  emoji: string;
  xpReward: number;
  type?: string;
  optionMode?: "TEXT" | "IMAGE" | "BOTH";
  timeSeconds?: number | null;
};

const MAX_HEARTS = 3;

export function LessonPlayer({
  lesson,
  questions,
  returnHref = "/jugador/learn",
}: {
  lesson: PlayerLesson;
  questions: PlayerQuestion[];
  returnHref?: string;
}) {
  const [phase, setPhase] = useState<"intro" | "question" | "feedback" | "results">("intro");
  const [qIndex, setQIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation?: string | null } | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [result, setResult] = useState<{ earnedXp: number; perfect: boolean; streak: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const question = questions[qIndex];
  const total = questions.length;
  const isLast = qIndex === total - 1;
  const isPerfect = correctCount === total;

  const lessonSeconds = useCallback(
    (qi: number) => {
      const q = questions[qi];
      if (q?.timeSeconds) return q.timeSeconds;
      if (lesson.type === "CONTRARRELOJ") return Number(lesson.timeSeconds) || 10;
      return null;
    },
    [questions, lesson]
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  useEffect(() => {
    if (phase !== "question") return;
    const secs =
      questions[qIndex]?.timeSeconds ??
      (lesson.type === "CONTRARRELOJ" ? Number(lesson.timeSeconds) || 10 : null);
    if (!secs) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null || s <= 1) return 0;
        return s - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, qIndex, questions, lesson, clearTimer]);

  const timeout = secondsLeft === 0 && phase === "question" && !!lessonSeconds(qIndex);

  useEffect(() => {
    if (!timeout || busy) return;
    const t = setTimeout(() => {
      clearTimer();
      setSelectedId(null);
      setTimedOut(true);
      setFeedback({ correct: false, explanation: "¡Se acabó el tiempo!" });
      setHearts((h) => h - 1);
      setPhase("feedback");
    }, 0);
    return () => clearTimeout(t);
  }, [timeout, busy, clearTimer]);

  const pickOption = async (optionId: string) => {
    if (busy || phase !== "question" || !question) return;
    setBusy(true);
    setSelectedId(optionId);
    clearTimer();

    const res = await submitAnswer({
      lessonId: lesson.id,
      questionId: question.id,
      optionId,
    });

    if (res.ok) {
      setTimedOut(false);
      setFeedback({ correct: res.correct, explanation: res.explanation });
      if (res.correct) {
        setCorrectCount((c) => c + 1);
      } else {
        setHearts((h) => h - 1);
      }
    }
    setBusy(false);
    setPhase("feedback");
  };

  const continueToNext = useCallback(async () => {
    clearTimer();
    setSelectedId(null);
    setTimedOut(false);
    setFeedback(null);
    setSecondsLeft(null);

    if (isLast) {
      setBusy(true);
      const res = await finishLesson({
        lessonId: lesson.id,
        correctCount,
        totalCount: total,
      });
      if (res.ok) {
        setResult({ earnedXp: res.earnedXp, perfect: res.perfect, streak: res.streak });
      }
      setBusy(false);
      setPhase("results");
      return;
    }

    setSecondsLeft(lessonSeconds(qIndex + 1));
    setQIndex((i) => i + 1);
    setPhase("question");
  }, [clearTimer, isLast, lesson.id, correctCount, total, qIndex, lessonSeconds]);

  const resetQuiz = useCallback(() => {
    clearTimer();
    setQIndex(0);
    setSelectedId(null);
    setTimedOut(false);
    setFeedback(null);
    setCorrectCount(0);
    setHearts(MAX_HEARTS);
    setResult(null);
    setSecondsLeft(null);
    setPhase("intro");
  }, [clearTimer]);

  const progressPct = Math.round((qIndex / total) * 100);
  const timedSeconds = lesson.type === "CONTRARRELOJ" ? Number(lesson.timeSeconds) || 10 : null;

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center gap-6 pt-8 text-center">
        <div className="animate-pop rounded-full bg-white p-8 text-7xl shadow-lg shadow-green-100 dark:bg-emerald-900 dark:shadow-green-950">
          {lesson.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-black">{lesson.title}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {total} preguntas · {lesson.xpReward} XP · 3 corazones
            {timedSeconds ? ` · ⏱ ${timedSeconds}s por pregunta` : ""}
            {lesson.optionMode === "IMAGE"
              ? " · 🖼️ opciones por imagen"
              : lesson.optionMode === "BOTH"
                ? " · 🖼️ texto e imagen"
                : ""}
          </p>
        </div>
        <button
          onClick={() => {
            setSecondsLeft(lessonSeconds(0));
            setPhase("question");
          }}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
        >
          Comenzar
        </button>
      </div>
    );
  }

  if (phase === "results") {
    const colors = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa"];
    return (
      <div className="relative flex flex-col items-center gap-6 overflow-hidden pt-6 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${(i * 100) / 24}%`,
                backgroundColor: colors[i % colors.length],
                animationDuration: `${2 + (i % 4) * 0.6}s`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="animate-pop mt-8 text-6xl">{isPerfect ? "🏆" : hearts === 0 ? "💪" : "⚽"}</div>
        <div>
          <h1 className="text-2xl font-black">
            {hearts === 0 && !isPerfect ? "¡Lo intentaste de nuevo!" : "¡Lección completada!"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Acertaste {correctCount} de {total} preguntas
          </p>
        </div>

        {result && (
          <div className="flex w-full gap-3">
            <div className="flex flex-1 flex-col items-center rounded-2xl bg-orange-50 p-4 dark:bg-orange-950/40">
              <div className="flex items-center gap-1 text-orange-500">
                <FlameIcon className="h-5 w-5" />
                <span className="text-2xl font-black">{result.streak}</span>
              </div>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Racha</span>
            </div>
            <div className="flex flex-1 flex-col items-center rounded-2xl bg-green-50 p-4 dark:bg-green-950/40">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <BoltIcon className="h-5 w-5" />
                <span className="text-2xl font-black">+{result.earnedXp}</span>
              </div>
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">XP ganado</span>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col gap-3">
          {hearts === 0 && !isPerfect ? (
            <button
              onClick={resetQuiz}
              className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
            >
              Intentar de nuevo
            </button>
          ) : (
            <Link
              href={returnHref}
              className="w-full rounded-2xl bg-green-500 py-4 text-center text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
            >
              Continuar
            </Link>
          )}
          <Link
            href={returnHref}
            className="w-full rounded-2xl border-2 border-green-200 py-3 text-center font-bold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            Volver al camino
          </Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const isFeedback = phase === "feedback";
  const showCorrect = feedback?.correct;
  const failed = hearts === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={returnHref}
          className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Salir"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: MAX_HEARTS }).map((_, i) => (
            <HeartIcon
              key={i}
              className={`h-5 w-5 ${i < hearts ? "text-red-500" : "text-zinc-200 dark:text-zinc-700"}`}
            />
          ))}
        </div>
      </div>

      {lessonSeconds(qIndex) && (
        <div className="flex items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
          <span>Tiempo</span>
          <div className="flex items-center gap-1">
            <BoltIcon className="h-4 w-4 text-amber-500" />
            {secondsLeft}s
          </div>
        </div>
      )}

      <div key={qIndex} className="animate-pop flex flex-col gap-4">
        <EmoteMascot
          state={!isFeedback ? "question" : timedOut ? "timeout" : showCorrect ? "correct" : "wrong"}
          text={
            !isFeedback ? (
              question.prompt
            ) : timedOut ? (
              "¡Se acabó el tiempo! ⏱️"
            ) : showCorrect ? (
              "¡Correcto! ✅"
            ) : (
              "¡Incorrecto! ❌"
            )
          }
          explanation={isFeedback ? feedback?.explanation : undefined}
        >
          {question.options.map((option, i) => {
              let style =
                "bg-white text-zinc-700 hover:bg-green-50 hover:border-green-300 dark:bg-emerald-900 dark:text-zinc-100 dark:hover:bg-green-950/50 dark:hover:border-green-600";
              if (isFeedback && showCorrect && option.id === selectedId) {
                style = "bg-green-500 text-white border-green-500";
              } else if (isFeedback && !showCorrect && option.id === selectedId) {
                style = "bg-red-500 text-white border-red-500 animate-shake";
              } else if (isFeedback) {
                style = "bg-white/50 text-zinc-400 border-zinc-200 dark:bg-emerald-900/50 dark:text-zinc-500 dark:border-zinc-700";
              }

              const isImageMode = lesson.optionMode === "IMAGE";
              const showImage = !!option.imageUrl && lesson.optionMode !== "TEXT";
              const showText = !isImageMode;

              return (
                <button
                  key={option.id}
                  disabled={isFeedback}
                  onClick={() => pickOption(option.id)}
                  className={`flex items-center gap-3 rounded-2xl border-2 border-zinc-200 px-4 py-3.5 text-left font-semibold transition active:scale-95 dark:border-zinc-700 ${style}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                    {["A", "B", "C", "D"][i] ?? i + 1}
                  </span>
                  <span className="flex flex-1 items-center gap-3">
                    {showImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={option.imageUrl ?? ""}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-xl object-cover"
                      />
                    )}
                    {showText && <span className="flex-1">{option.text}</span>}
                  </span>
                  {isFeedback && showCorrect && option.id === selectedId && (
                    <CheckIcon className="h-5 w-5" />
                  )}
                  {isFeedback && !showCorrect && option.id === selectedId && (
                    <XIcon className="h-5 w-5" />
                  )}
                </button>
              );
            })}
        </EmoteMascot>
      </div>

      {failed && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm font-bold text-red-500">
            Te quedaste sin corazones
          </p>
          <button
            onClick={resetQuiz}
            className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95"
          >
            Volver a empezar
          </button>
        </div>
      )}

      {isFeedback && !failed && (
        <button
          onClick={continueToNext}
          disabled={busy}
          className="w-full rounded-2xl bg-green-500 py-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-600 active:scale-95 disabled:opacity-50"
        >
          {busy ? "..." : isLast ? "Ver resultados" : "Continuar"}
        </button>
      )}
    </div>
  );
}
