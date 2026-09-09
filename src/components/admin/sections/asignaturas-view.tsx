import { prisma } from "@/lib/prisma";
import { BookIcon } from "@/components/icons";
import {
  NewTemaModal,
  EditTemaModal,
  DeleteTemaButton,
} from "@/components/admin/etapa-materia-form";
import {
  AddLessonToTemaModal,
  RemoveLessonsFromTemaButton,
} from "@/components/admin/materia-lessons";

function groupLessons(
  lessons: { id: string; title: string; emoji: string; type: string; xpReward: number }[]
) {
  const groups = new Map<
    string,
    {
      key: string;
      ids: string[];
      title: string;
      emoji: string;
      type: string;
      xpReward: number;
      count: number;
    }
  >();
  for (const lesson of lessons) {
    const key = lesson.title.trim().toLowerCase();
    const group = groups.get(key);
    if (group) {
      group.ids.push(lesson.id);
      group.count += 1;
    } else {
      groups.set(key, {
        key,
        ids: [lesson.id],
        title: lesson.title,
        emoji: lesson.emoji,
        type: lesson.type,
        xpReward: lesson.xpReward,
        count: 1,
      });
    }
  }
  return [...groups.values()];
}

export async function AsignaturasView() {
  const [clases, temas, availableLessons] = await Promise.all([
    prisma.clase.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, emoji: true },
    }),
    prisma.tema.findMany({
      orderBy: { order: "asc" },
      include: {
        clases: { select: { id: true, name: true, emoji: true, color: true } },
        lessons: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, emoji: true, type: true, xpReward: true },
        },
        _count: { select: { lessons: true } },
      },
    }),
    prisma.lesson.findMany({
      where: { temaId: null },
      orderBy: [{ order: "asc" }, { title: "asc" }],
      select: { id: true, title: true, emoji: true, type: true, temaId: true },
    }),
  ]);

  // Un título usado en cualquier materia ya no se ofrece: evita repetir la
  // misma lección en los caminos.
  const usedTitles = new Set(
    availableLessons
      .filter((lesson) => lesson.temaId !== null)
      .map((lesson) => lesson.title.trim().toLowerCase())
  );

  // Una sola fila por lección y una sola copia agregada a la materia.
  const lessonGroups = new Map<
    string,
    { key: string; ids: string[]; title: string; emoji: string; type: string; count: number }
  >();
  for (const lesson of availableLessons) {
    if (lesson.temaId !== null) continue;
    if (usedTitles.has(lesson.title.trim().toLowerCase())) continue;
    const key = lesson.title.trim().toLowerCase();
    const group = lessonGroups.get(key);
    if (group) {
      group.ids.push(lesson.id);
      group.count += 1;
    } else {
      lessonGroups.set(key, {
        key,
        ids: [lesson.id],
        title: lesson.title,
        emoji: lesson.emoji,
        type: lesson.type,
        count: 1,
      });
    }
  }
  const lessonOptions = [...lessonGroups.values()];

  const claseOptions = clases.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-emerald-950 dark:text-white">
            <BookIcon className="h-6 w-6 text-purple-500" />
            Materias
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Todas las materias creadas en el proyecto, sin importar su etapa. Aquí las editas, asocias y
            les agregas lecciones.
          </p>
        </div>
        <NewTemaModal clases={claseOptions} />
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {clases.map((s) => (
            <span
              key={s.id}
              className="rounded-full bg-white/60 backdrop-blur-xl px-3 py-1.5 text-xs font-black text-zinc-600 ring-1 ring-green-100 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-zinc-300 dark:ring-emerald-900"
            >
              {s.emoji} {s.name}
            </span>
          ))}
        </div>

        {temas.length === 0 && (
          <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
            Aún no hay materias. Crea la primera desde el formulario.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {temas.map((tema) => {
            const isUnassigned = tema.clases.length === 0;
            return (
              <div
                key={tema.id}
                className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: `${tema.color}22` }}
                  >
                    {tema.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-emerald-950 dark:text-white">{tema.name}</p>
                    <p className="text-[11px] font-bold text-zinc-400">
                      {tema._count.lessons} lecciones · {tema.xpReward} XP
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {isUnassigned ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          Sin etapa
                        </span>
                      ) : (
                        tema.clases.map((clase) => (
                          <span
                            key={clase.id}
                            className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-black ring-1 ring-green-100 dark:bg-emerald-950/60 dark:ring-emerald-900"
                            style={{ color: clase.color }}
                          >
                            {clase.emoji} {clase.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <AddLessonToTemaModal
                    temaId={tema.id}
                    temaName={tema.name}
                    lessons={lessonOptions}
                  />
                  <EditTemaModal tema={tema} clases={claseOptions} />
                  <DeleteTemaButton id={tema.id} />
                </div>

                <div className="mt-3 border-t border-green-50 pt-3 dark:border-emerald-900">
                  {tema.lessons.length === 0 ? (
                    <p className="text-xs font-bold text-zinc-400">
                      Esta materia aún no tiene lecciones agregadas.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {groupLessons(tema.lessons).map((lesson) => (
                        <li
                          key={lesson.key}
                          className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 ring-1 ring-green-100 dark:bg-emerald-950/60 dark:ring-emerald-900"
                        >
                          <span className="text-lg">{lesson.emoji}</span>
                          <span className="min-w-0 flex-1 truncate text-sm font-bold text-emerald-950 dark:text-white">
                            {lesson.title}
                          </span>
                          {lesson.count > 1 && (
                            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                              ×{lesson.count}
                            </span>
                          )}
                          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                            {lesson.type === "QUIZ" ? "Quiz" : "Lección"}
                          </span>
                          <span className="shrink-0 text-[10px] font-black text-zinc-400">
                            {lesson.xpReward} XP
                          </span>
                          <RemoveLessonsFromTemaButton temaId={tema.id} ids={lesson.ids} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}