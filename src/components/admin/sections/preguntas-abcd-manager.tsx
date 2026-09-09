"use client";

import { LessonEditorModal } from "@/components/admin/lesson-editor-modal";
import { DeleteLessonButton } from "@/components/admin/lesson-editor";
import { PlusIcon, BoltIcon } from "@/components/icons";

export type PreguntasLessonViewModel = {
  id: string;
  title: string;
  emoji: string;
  type: "PREGUNTADOS" | "CONTRARRELOJ";
  optionMode: "TEXT" | "IMAGE" | "BOTH";
  timeSeconds: number | null;
  xpReward: number;
  questionCount: number;
};

type EditorClase = {
  id: string;
  name: string;
  emoji: string;
  temas: { id: string; name: string }[];
};

const TYPE_META = {
  PREGUNTADOS: { label: "Preguntados", className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" },
  CONTRARRELOJ: { label: "Contrarreloj", className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
} as const;

const MODE_LABELS: Record<string, string> = {
  TEXT: "Solo texto",
  IMAGE: "Solo imagen",
  BOTH: "Texto e imagen",
};

const rowCls =
  "rounded-2xl border border-green-100 bg-white/60 p-4 backdrop-blur-xl dark:border-emerald-800 dark:bg-emerald-950/60";

export function PreguntasAbcdManager({
  clases,
  lessons,
}: {
  clases: EditorClase[];
  lessons: PreguntasLessonViewModel[];
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-emerald-950 dark:text-white">
            Preguntas A-D <span className="text-zinc-400">({lessons.length})</span>
          </h3>
          <p className="text-xs font-bold text-zinc-400">
            Preguntados y Contrarreloj: elige la opción correcta (A, B, C, D) con 3 vidas. Las opciones pueden ser texto, imagen o ambas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LessonEditorModal
            clases={clases}
            mode="lessons"
            initialType="PREGUNTADOS"
            title="Nueva lección · Preguntados"
            label={
              <span className="flex items-center gap-1.5">
                <PlusIcon className="h-4 w-4" /> Preguntados
              </span>
            }
            className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 active:scale-95 dark:shadow-sky-950"
          />
          <LessonEditorModal
            clases={clases}
            mode="lessons"
            initialType="CONTRARRELOJ"
            title="Nueva lección · Contrarreloj"
            label={
              <span className="flex items-center gap-1.5">
                <BoltIcon className="h-4 w-4" /> Contrarreloj
              </span>
            }
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 active:scale-95 dark:shadow-amber-950"
          />
        </div>
      </div>

      {lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center dark:border-emerald-800">
          <p className="text-sm font-bold text-zinc-400">
            Aún no hay lecciones de Preguntados ni Contrarreloj. Crea la primera.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => {
            const meta = TYPE_META[lesson.type];
            return (
              <div key={lesson.id} className={`${rowCls} flex flex-wrap items-center gap-3`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm dark:bg-emerald-900">
                  {lesson.emoji || "❓"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-black text-emerald-950 dark:text-white">
                    {lesson.title}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${meta.className}`}>
                      {meta.label}
                    </span>
                  </p>
                  <p className="text-xs font-bold text-zinc-400">
                    {lesson.questionCount} {lesson.questionCount === 1 ? "pregunta" : "preguntas"} · {MODE_LABELS[lesson.optionMode]}{" "}
                    {lesson.type === "CONTRARRELOJ" && lesson.timeSeconds ? (
                      <>· ⏱ {lesson.timeSeconds}s por pregunta</>
                    ) : null}{" "}
                    · XP: <strong className="text-emerald-600 dark:text-emerald-300">{lesson.xpReward}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <LessonEditorModal
                    clases={clases}
                    mode="lessons"
                    lessonId={lesson.id}
                    title={`Editar · ${lesson.title}`}
                    label="Editar"
                    className="rounded-lg border-2 border-zinc-200 px-2.5 py-1.5 text-xs font-black text-zinc-500 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/40"
                  />
                  <DeleteLessonButton id={lesson.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}