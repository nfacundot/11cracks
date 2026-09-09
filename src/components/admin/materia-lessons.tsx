"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/admin/modal";
import { PlusIcon, XIcon } from "@/components/icons";
import { addLessonsToTema, removeLessonsFromTema } from "@/actions/admin";

export type AvailableLesson = {
  key: string;
  ids: string[];
  title: string;
  emoji: string;
  type: string;
  count: number;
};

const TYPE_LABEL: Record<string, string> = {
  LESSON: "Lección",
  QUIZ: "Quiz",
  GAME: "Juego",
};

export function AddLessonToTemaModal({
  temaId,
  temaName,
  lessons,
}: {
  temaId: string;
  temaName: string;
  lessons: AvailableLesson[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter((l) => l.title.toLowerCase().includes(q));
  }, [lessons, query]);

  // Solo cuentan las selecciones que siguen disponibles, para no sumar repetidas.
  const selectedKeys = useMemo(
    () => selected.filter((key) => available.some((l) => l.key === key)),
    [selected, available]
  );

  const totalAvailable = useMemo(
    () => available.reduce((sum, l) => sum + l.count, 0),
    [available]
  );

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));

  const openModal = () => {
    setSelected([]);
    setQuery("");
    setError("");
    setOpen(true);
  };

  const submit = () => {
    setError("");
    startTransition(async () => {
      const ids = available
        .filter((l) => selectedKeys.includes(l.key))
        .map((l) => l.ids[0]);
      const res = await addLessonsToTema(temaId, ids);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSelected([]);
      setQuery("");
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-green-600 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-emerald-900"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Agregar lección
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Agregar lecciones a ${temaName}`} size="lg">
        <div className="space-y-3">
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Solo se muestran las lecciones que no están agregadas a ninguna materia (
            {totalAvailable} disponible{totalAvailable === 1 ? "" : "s"}).
          </p>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar lección..."
            className="w-full rounded-xl border-2 border-green-100 bg-white/60 px-3 py-2 text-sm font-semibold text-emerald-950 outline-none transition focus:border-green-400 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-white"
          />

          {available.length === 0 ? (
            <p className="py-8 text-center text-sm font-bold text-zinc-400">
              No hay lecciones disponibles: las lecciones creadas ya están en una materia.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {available.map((lesson) => {
                const checked = selectedKeys.includes(lesson.key);
                return (
                  <label
                    key={lesson.key}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition ${
                      checked
                        ? "border-green-400 bg-green-500/10"
                        : "border-green-100 bg-white/60 hover:bg-green-50 dark:border-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(lesson.key)}
                      className="h-4 w-4 accent-green-500"
                    />
                    <span className="text-xl">{lesson.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-emerald-950 dark:text-white">
                        {lesson.title}
                      </span>
                      <span className="block text-[11px] font-bold text-zinc-400">
                        {TYPE_LABEL[lesson.type] ?? lesson.type} · Sin materia
                      </span>
                    </span>
                    {lesson.count > 1 && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        ×{lesson.count}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {error && <p className="text-sm font-bold text-red-500">{error}</p>}

          <div className="flex items-center justify-between gap-3 border-t border-green-50 pt-3 dark:border-emerald-900">
            <span className="text-xs font-bold text-zinc-400">
              {selectedKeys.length} seleccionada{selectedKeys.length === 1 ? "" : "s"}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border-2 border-green-200 px-4 py-2 text-sm font-black text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending || selectedKeys.length === 0}
                onClick={submit}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-black text-white transition hover:bg-green-600 active:scale-95 disabled:opacity-50"
              >
                {pending ? "Agregando…" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function RemoveLessonsFromTemaButton({
  temaId,
  ids,
}: {
  temaId: string;
  ids: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title="Quitar de la materia"
      aria-label="Quitar de la materia"
      onClick={() =>
        startTransition(async () => {
          await removeLessonsFromTema(temaId, ids);
          router.refresh();
        })
      }
      className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950/40"
    >
      <XIcon className="h-4 w-4" />
    </button>
  );
}
