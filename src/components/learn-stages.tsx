"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from "@/components/icons";
import { LearnAsignaturaSheet } from "@/components/learn-asignatura-sheet";

export type AsignaturaLessonData = {
  id: string;
  order: number;
  title: string;
  emoji: string;
  color: string;
  type: string;
  xpReward: number;
  questionCount: number;
  started: boolean;
  completed: boolean;
  bestScore: number;
};

export type AsignaturaData = {
  id: string;
  order: number;
  title: string;
  emoji: string;
  color: string;
  xpReward: number;
  posX: number;
  posY: number;
  lessons: AsignaturaLessonData[];
};

export type EtapaData = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  order: number;
  asignaturas: AsignaturaData[];
};

export default function LearnStages({
  etapas,
  totalCompleted,
  totalLessons,
}: {
  etapas: EtapaData[];
  totalCompleted: number;
  totalLessons: number;
}) {
  const [etapaIndex, setEtapaIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<AsignaturaData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 5000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(id);
    };
  }, [router]);

  const etapa = etapas[etapaIndex] ?? etapas[0];
  const asignaturas = etapa?.asignaturas ?? [];
  const isGeneral = etapa?.id === "sin-etapa";
  const canvasHeight = Math.max(560, asignaturas.length * 170);
  const firstIncompleteIndex = asignaturas.findIndex(
    (a) => a.lessons.length > 0 && !a.lessons.every((l) => l.completed)
  );

  const lessonsOf = (e: EtapaData) =>
    e.asignaturas.flatMap((a) => a.lessons);

  const selectEtapa = (i: number) => {
    setEtapaIndex(i);
    setMenuOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-0 z-0 mx-auto max-w-md overflow-hidden">
      <Image
        src="/img/back/backa.png"
        alt=""
        fill
        priority
        sizes="(max-width: 448px) 448px, 448px"
        className="object-cover"
      />

      <div className="absolute inset-x-0 top-[3.25rem] bottom-0 z-10 overflow-y-auto px-4 pb-8 pt-1">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 shadow-xl ring-2 transition active:scale-[0.98] ${
              menuOpen
                ? "bg-emerald-950 text-white ring-green-400"
                : "bg-white/55 backdrop-blur-xl text-emerald-950 ring-white/70 dark:bg-emerald-950/55 dark:text-white dark:ring-emerald-800"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl text-lg"
                style={{
                  backgroundColor: etapa ? `${etapa.color}33` : "#16a34a33",
                }}
              >
                {etapa?.emoji ?? "🗺️"}
              </span>
              <span className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-widest opacity-60">
                  Etapa
                </span>
                <span className="block text-sm font-black leading-tight">
                  {etapa?.name ?? "Selecciona una etapa"}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-green-600/15 px-2.5 py-1 text-[11px] font-black text-green-700 dark:bg-green-500/15 dark:text-green-400">
                {totalCompleted}/{totalLessons}
              </span>
              <ChevronDownIcon
                className={`h-5 w-5 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </span>
          </button>
        </div>

        {isGeneral ? (
          <div className="mt-4 space-y-3">
            {asignaturas.length === 0 && (
              <div className="rounded-2xl bg-white/55 backdrop-blur-xl px-4 py-8 text-center text-sm font-bold text-zinc-400 shadow-xl ring-2 ring-white/70 dark:bg-emerald-950/55 dark:ring-emerald-800">
                Esta etapa aún no tiene asignaturas.
              </div>
            )}

            {asignaturas.map((asignatura) => {
              const completed = asignatura.lessons.filter((l) => l.completed).length;
              const done = asignatura.lessons.length > 0 && completed === asignatura.lessons.length;
              return (
                <button
                  key={asignatura.id}
                  type="button"
                  onClick={() => setSelected(asignatura)}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-white/55 backdrop-blur-xl p-3 text-left shadow-xl ring-2 ring-white/70 transition hover:bg-white/70 active:scale-[0.98] dark:bg-emerald-950/55 dark:ring-emerald-800"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: `${asignatura.color}33` }}
                  >
                    {asignatura.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black leading-tight text-emerald-950 dark:text-white">
                      {asignatura.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      {asignatura.lessons.length > 0 ? (
                        <>
                          {completed}/{asignatura.lessons.length} lecciones completadas
                        </>
                      ) : (
                        "Sin lecciones todavía"
                      )}
                    </span>
                  </span>
                  {done && <CheckIcon className="h-5 w-5 shrink-0 text-green-500" />}
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-300 transition group-hover:translate-x-1 dark:text-zinc-600" />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="relative mx-auto mt-4 w-full max-w-md overflow-hidden rounded-2xl shadow-xl ring-2 ring-white/70 dark:ring-emerald-800">
            <div className="relative" style={{ height: canvasHeight }}>
              <Image
                src="/img/back/backa.png"
                alt=""
                fill
                sizes="(max-width: 448px) 448px, 448px"
                className="object-cover"
              />
              {asignaturas.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-bold text-zinc-400">
                  Esta etapa aún no tiene asignaturas.
                </div>
              )}
              {asignaturas.map((asignatura, i) => {
                const completed = asignatura.lessons.filter((l) => l.completed).length;
                const hasLessons = asignatura.lessons.length > 0;
                const done = hasLessons && completed === asignatura.lessons.length;
                const isNext = i === firstIncompleteIndex;
                return (
                  <button
                    key={asignatura.id}
                    type="button"
                    onClick={() => setSelected(asignatura)}
                    className={`absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-2xl shadow-xl ring-4 ring-white transition active:scale-95 dark:ring-emerald-950 ${
                      isNext ? "animate-glow" : ""
                    }`}
                    style={{
                      left: `${asignatura.posX}%`,
                      top: `${asignatura.posY}%`,
                      backgroundColor: asignatura.color,
                      opacity: done ? 0.85 : 1,
                    }}
                  >
                    <span className="pointer-events-none">{asignatura.emoji}</span>
                    <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/60 backdrop-blur-xl text-[11px] font-black text-emerald-950 shadow dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-white">
                      {i + 1}
                    </span>
                    {done ? (
                      <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white shadow">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    ) : hasLessons ? (
                      <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/60 backdrop-blur-xl text-[10px] font-black text-emerald-950 shadow dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-white">
                        {completed}/{asignatura.lessons.length}
                      </span>
                    ) : null}
                    <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 w-max max-w-[9rem] -translate-x-1/2 truncate rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-black text-white shadow backdrop-blur-sm">
                      {asignatura.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-full">
        <span className="animate-float absolute left-[12%] top-[48%] text-2xl opacity-80" style={{ animationDelay: "0.4s" }}>⚽</span>
        <span className="animate-float absolute right-[10%] top-[30%] text-xl opacity-70" style={{ animationDelay: "1s" }}>🏆</span>
        <span className="animate-float absolute left-[8%] top-[18%] text-xl opacity-60" style={{ animationDelay: "1.6s" }}>🎉</span>
      </div>

      {menuOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setMenuOpen(false)}
            />
            <div className="animate-pop fixed inset-x-0 top-[7.5rem] z-50 mx-auto max-w-md overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl px-4 py-2 shadow-2xl ring-1 ring-green-100 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:ring-green-900">
              {etapas.map((e, i) => {
                const lessons = lessonsOf(e);
                const done = lessons.length > 0 && lessons.every((l) => l.completed);
                const isCurrent = etapaIndex === i;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => selectEtapa(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-green-50 dark:hover:bg-green-900/40 ${
                      isCurrent ? "bg-green-50 dark:bg-green-900/60" : ""
                    }`}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: `${e.color}22` }}
                    >
                      {e.emoji}
                    </span>
                    <span className="flex-1">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Etapa {i + 1}
                      </span>
                      <span className="block text-sm font-black leading-tight text-emerald-950 dark:text-white">
                        {e.name}
                      </span>
                    </span>
                    {done && lessons.length > 0 ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {lessons.filter((l) => l.completed).length}/{lessons.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}

      {selected && (
        <LearnAsignaturaSheet
          asignatura={selected}
          etapaName={etapa?.name}
          etapaEmoji={etapa?.emoji}
          etapaColor={etapa?.color}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
