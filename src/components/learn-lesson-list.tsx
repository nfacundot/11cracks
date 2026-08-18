"use client";

import Link from "next/link";
import { CheckIcon, LockIcon } from "@/components/icons";

type LessonItem = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  xpReward: number;
  questions: { id: string }[];
  progress: { completed: boolean }[];
};

export function LearnLessonList({
  lessons,
  firstIncompleteIndex,
}: {
  lessons: LessonItem[];
  firstIncompleteIndex: number;
}) {
  return (
    <div className="mt-4 space-y-3">
      {lessons.length === 0 && (
        <div className="rounded-2xl bg-white/55 backdrop-blur-xl px-4 py-8 text-center text-sm font-bold text-zinc-400 shadow-xl ring-2 ring-white/70 dark:bg-emerald-950/55 dark:ring-emerald-800">
          Este tema aún no tiene lecciones.
        </div>
      )}

      {lessons.map((lesson, i) => {
        const progress = lesson.progress[0];
        const done = Boolean(progress?.completed);
        const locked =
          !done && firstIncompleteIndex !== -1 && i > firstIncompleteIndex;
        const isNext = !done && !locked && i === firstIncompleteIndex;
        const href = locked ? "#" : `/lesson/${lesson.id}`;

        return (
          <Link
            key={lesson.id}
            href={href}
            onClick={locked ? (e) => e.preventDefault() : undefined}
            className={`group flex items-center gap-3 rounded-2xl bg-white/55 backdrop-blur-xl p-3 shadow-xl ring-2 ring-white/70 transition active:scale-[0.98] dark:bg-emerald-950/55 dark:ring-emerald-800 ${
              isNext ? "animate-glow" : ""
            }`}
          >
            <span
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{
                backgroundColor: locked ? "#9ca3af33" : `${lesson.color}33`,
              }}
            >
              {locked ? (
                <LockIcon className="h-5 w-5 text-zinc-400" />
              ) : (
                lesson.emoji
              )}
              <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-emerald-950 shadow">
                {i + 1}
              </span>
              {done && (
                <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow">
                  <CheckIcon className="h-3 w-3" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black leading-tight text-emerald-950 dark:text-white">
                {lesson.title}
              </span>
              <span className="mt-0.5 block text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {lesson.xpReward} XP · {lesson.questions.length} preguntas
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
