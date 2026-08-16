import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PlusIcon, BookIcon, DumbbellIcon, BoltIcon } from "@/components/icons";
import { DeleteLessonButton } from "@/components/admin/lesson-editor";

export const metadata = { title: "Lecciones | Admin" };

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  LESSON: { label: "Lección", icon: <BookIcon className="h-4 w-4" />, color: "bg-blue-500" },
  QUIZ: { label: "Quiz", icon: <BoltIcon className="h-4 w-4" />, color: "bg-purple-500" },
  TRAINING: { label: "Entrenamiento", icon: <DumbbellIcon className="h-4 w-4" />, color: "bg-green-500" },
};

const GAME_MODE_META: Record<string, { label: string; emoji: string }> = {
  PENALTY: { label: "Tanda de Penales", emoji: "🥅" },
  MEMORY: { label: "Memoria Táctica", emoji: "🧠" },
  QUIZ: { label: "Cuestionario", emoji: "📝" },
  SPRINT: { label: "Sprint Express", emoji: "⚡" },
  SETBACKS: { label: "Contratiempos", emoji: "⚠️" },
  INFOGRAMA: { label: "Infograma", emoji: "🖼️" },
};

type LessonCardData = {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  type: string;
  gameMode: string | null;
  xpReward: number;
  _count: { questions: number };
};

function LessonCard({ lesson }: { lesson: LessonCardData }) {
  const meta = TYPE_META[lesson.type] ?? TYPE_META.LESSON;
  return (
    <div className="flex flex-col rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 transition hover:shadow-md dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: `${lesson.color}22` }}
        >
          {lesson.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-black text-white ${meta.color}`}>
              {meta.label}
            </span>
            {lesson.gameMode && GAME_MODE_META[lesson.gameMode] && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-zinc-500 ring-1 ring-zinc-200 dark:bg-emerald-900 dark:text-zinc-300 dark:ring-emerald-800">
                {GAME_MODE_META[lesson.gameMode].emoji} {GAME_MODE_META[lesson.gameMode].label}
              </span>
            )}
            {lesson.xpReward > 0 && (
              <span className="text-[10px] font-black text-zinc-400">{lesson.xpReward} XP</span>
            )}
          </div>
          <h3 className="mt-1 font-black leading-tight text-emerald-950 dark:text-white">
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
              {lesson.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
        {lesson._count.questions} preguntas
      </div>

      <div className="mt-4 flex gap-2 border-t border-green-50 pt-3 dark:border-emerald-900">
        <Link
          href={`/admin/lessons/${lesson.id}`}
          className="flex-1 rounded-xl bg-green-500 py-2 text-center text-xs font-black text-white transition hover:bg-green-600"
        >
          Editar
        </Link>
        <Link
          href={`/lesson/${lesson.id}`}
          className="rounded-xl border-2 border-green-200 px-3 py-2 text-xs font-black text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400"
        >
          Ver en app
        </Link>
        <DeleteLessonButton id={lesson.id} />
      </div>
    </div>
  );
}

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; materia?: string }>;
}) {
  await requireAdmin();

  const { type, materia } = await searchParams;
  const filterType =
    type && ["LESSON", "QUIZ", "TRAINING"].includes(type) ? type : null;

  const etapaLessonsWhere = filterType
    ? { type: filterType as "LESSON" | "QUIZ" | "TRAINING" }
    : ({ type: { not: "GAME" } } as const);

  const etapas = await prisma.etapa.findMany({
    orderBy: { order: "asc" },
    include: {
      materias: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: etapaLessonsWhere,
            orderBy: { order: "asc" },
            include: { _count: { select: { questions: true } } },
          },
        },
      },
    },
  });

  const unassignedMaterias = await prisma.materia.findMany({
    where: { etapaId: null },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        where: etapaLessonsWhere,
        orderBy: { order: "asc" },
        include: { _count: { select: { questions: true } } },
      },
    },
  });

  const orphanLessons = await prisma.lesson.findMany({
    where: {
      materiaId: null,
      ...(filterType
        ? { type: filterType as "LESSON" | "QUIZ" | "TRAINING" }
        : ({ type: { not: "GAME" } } as const)),
    },
    orderBy: { order: "asc" },
    include: { _count: { select: { questions: true } } },
  });

  const allMaterias = [
    ...etapas.flatMap((e) => e.materias),
    ...unassignedMaterias,
  ];
  const filteredMateria = materia
    ? allMaterias.find((m) => m.id === materia)
    : undefined;

  const countByType = await prisma.lesson.groupBy({
    by: ["type"],
    _count: { _all: true },
  });
  const typeCounts = Object.fromEntries(countByType.map((c) => [c.type, c._count._all]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-emerald-950 dark:text-white">
            <BookIcon className="h-6 w-6 text-green-500" />
            Lecciones
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Lecciones, quizzes y entrenamientos de cada asignatura. Los juegos se gestionan en el
            panel <Link href="/admin/juegos" className="font-bold text-orange-500 underline">Juegos</Link>.
          </p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-black text-white shadow-md shadow-green-200 transition hover:bg-green-600 active:scale-95 dark:shadow-green-950"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva lección
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={materia ? `/admin/lessons?materia=${materia}` : "/admin/lessons"}
          className={`rounded-full px-4 py-2 text-xs font-black transition ${
            !filterType
              ? "bg-emerald-950 text-white dark:bg-white dark:text-emerald-950"
              : "bg-white/60 backdrop-blur-xl text-zinc-600 hover:bg-green-50 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-zinc-300"
          }`}
        >
          Todo
        </Link>
        {Object.entries(TYPE_META).map(([key, meta]) => (
          <Link
            key={key}
            href={`/admin/lessons?${materia ? `materia=${materia}&` : ""}type=${key}`}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black transition ${
              filterType === key
                ? "bg-emerald-950 text-white dark:bg-white dark:text-emerald-950"
                : "bg-white/60 backdrop-blur-xl text-zinc-600 hover:bg-green-50 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-zinc-300"
            }`}
          >
            {meta.icon}
            {meta.label} ({typeCounts[key] ?? 0})
          </Link>
        ))}
      </div>

      {filteredMateria && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          Filtrando por asignatura: {filteredMateria.emoji} {filteredMateria.name}
          <Link href="/admin/lessons" className="ml-3 underline">
            Limpiar filtro
          </Link>
        </div>
      )}

      <div className="space-y-8">
        {etapas.map((etapa) => (
          <section key={etapa.id} className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-black text-emerald-950 dark:text-white">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: `${etapa.color}22` }}
              >
                {etapa.emoji}
              </span>
              {etapa.name}
            </h3>
            {etapa.materias.length === 0 ? (
              <p className="text-sm font-bold text-zinc-400">
                Sin asignaturas en esta etapa.
              </p>
            ) : (
              <div className="space-y-4">
                {etapa.materias.map((materia) => (
                  <div key={materia.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-sm font-black text-emerald-950 dark:text-white">
                        <span>{materia.emoji}</span> {materia.name}
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {materia.lessons.length}
                        </span>
                      </h4>
                      <Link
                        href={`/admin/lessons?materia=${materia.id}`}
                        className="text-xs font-bold text-green-600 transition hover:text-green-700 dark:text-green-400"
                      >
                        Ver solo esta asignatura
                      </Link>
                    </div>
                    {materia.lessons.length === 0 ? (
                      <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-xs font-bold text-zinc-400 dark:bg-emerald-900">
                        Esta asignatura aún no tiene lecciones.
                      </p>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                        {materia.lessons.map((lesson) => (
                          <LessonCard key={lesson.id} lesson={lesson} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {unassignedMaterias.length > 0 && (
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-black text-amber-700 dark:text-amber-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-950">
                🗺️
              </span>
              Asignaturas sin etapa
            </h3>
            <div className="space-y-3">
              {unassignedMaterias.map((materia) => (
                <div key={materia.id} className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-black text-emerald-950 dark:text-white">
                    <span>{materia.emoji}</span> {materia.name}
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {materia.lessons.length}
                    </span>
                  </h4>
                  {materia.lessons.length > 0 && (
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                      {materia.lessons.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {orphanLessons.length > 0 && (
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-black text-amber-700 dark:text-amber-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-950">
                ⚡
              </span>
              Lecciones sin asignatura
            </h3>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {orphanLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </section>
        )}
      </div>

      {allMaterias.length === 0 && orphanLessons.length === 0 && (
        <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
          No hay lecciones. Crea la primera.
        </div>
      )}
    </div>
  );
}
