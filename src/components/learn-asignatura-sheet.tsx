"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CheckIcon, LockIcon, XIcon } from "@/components/icons";

type SheetLesson = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  type: string;
  xpReward: number;
  questionCount: number;
  started: boolean;
  completed: boolean;
};

type SheetTema = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  xpReward: number;
  lessons: SheetLesson[];
};

export function LearnAsignaturaSheet({
  tema,
  claseName,
  claseEmoji,
  claseColor,
  onClose,
}: {
  tema: SheetTema;
  claseName?: string;
  claseEmoji?: string;
  claseColor?: string;
  onClose: () => void;
}) {
  const lessons = tema.lessons;
  const completedCount = lessons.filter((l) => l.completed).length;
  const firstIncompleteIndex = lessons.findIndex((l) => !l.completed);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-[2px]"
      />
      <div className="animate-sheet-up absolute inset-x-0 bottom-0 mx-auto flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white/60 backdrop-blur-xl shadow-2xl dark:bg-emerald-950/60 dark:backdrop-blur-xl">
        <div className="shrink-0 px-4 pt-2.5">
          <span className="mx-auto block h-1.5 w-10 rounded-full bg-zinc-200 dark:bg-emerald-800" />
        </div>

        <div className="flex shrink-0 items-start gap-3 border-b border-green-100 px-4 pb-3 pt-3 dark:border-emerald-800">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-inner"
            style={{ backgroundColor: `${tema.color}33` }}
          >
            {tema.emoji}
          </span>
          <div className="min-w-0 flex-1">
            {claseName && (
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: claseColor }}>
                {claseEmoji} {claseName}
              </p>
            )}
            <h3 className="truncate text-base font-black text-emerald-950 dark:text-white">
              {tema.title}
            </h3>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              {completedCount}/{lessons.length} lecciones completadas
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 dark:bg-emerald-900 dark:text-zinc-400 dark:hover:bg-emerald-800"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="safe-bottom flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
          {lessons.length === 0 && (
            <div className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm font-bold text-zinc-400 dark:bg-emerald-900">
              Este tema aún no tiene lecciones.
            </div>
          )}

          {lessons.map((lesson, i) => {
            const done = lesson.completed;
            const locked = !done && firstIncompleteIndex !== -1 && i > firstIncompleteIndex;
            const isNext = !done && !locked && i === firstIncompleteIndex;
            const rowClass = `flex items-center gap-3 rounded-2xl bg-zinc-50 p-3 ring-1 ring-green-100 dark:bg-emerald-900 dark:ring-emerald-800 ${
              isNext ? "animate-glow" : ""
            }`;
            const content = (
              <>
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
                  <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/60 backdrop-blur-xl text-[10px] font-black text-emerald-950 shadow dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-white">
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
                    {lesson.xpReward} XP · {lesson.questionCount} preguntas
                  </span>
                </span>
              </>
            );

            return locked ? (
              <div key={lesson.id} className={`${rowClass} opacity-70`}>
                {content}
              </div>
            ) : (
              <Link
                key={lesson.id}
                href={`/lesson/${lesson.id}`}
                onClick={onClose}
                className={`${rowClass} transition active:scale-[0.98]`}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
