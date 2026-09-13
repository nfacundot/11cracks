import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { ArrowLeftIcon } from "@/components/icons";
import { JuegosManager, type GameViewModel, type PreguntasLessonViewModel } from "@/components/admin/sections/juegos-manager";

export const metadata = { title: "Configurador de lecciones | Admin" };

export const dynamic = "force-dynamic";

export default async function SettingsLeccionesPage() {
  await requireSection("ADMIN");

  const games = await prisma.game.findMany({
    orderBy: [{ active: "desc" }, { order: "asc" }],
    include: {
      lesson: { orderBy: [{ order: "asc" }, { createdAt: "asc" }], select: { xpReward: true }, take: 1 },
      _count: {
        select: {
          lesson: true,
          oidoWords: true,
          golWords: true,
          letrasWords: true,
          alimentacionWords: true,
        },
      },
    },
  });

  const quizLessons = await prisma.lesson.findMany({
    where: { type: { in: ["PREGUNTADOS", "CONTRARRELOJ", "SPEAKING", "TYPING"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      emoji: true,
      type: true,
      optionMode: true,
      timeSeconds: true,
      xpReward: true,
      language: true,
      _count: { select: { questions: true } },
    },
  });

  const clases = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    include: { temas: { orderBy: { order: "asc" }, select: { id: true, name: true } } },
  });

  const gamesView: GameViewModel[] = games.map((game) => ({
    id: game.id,
    slug: game.slug,
    name: game.name,
    category: game.category,
    emoji: game.emoji,
    color: game.color,
    description: game.description,
    active: game.active,
    wordCount: game._count.oidoWords + game._count.golWords + game._count.letrasWords + game._count.alimentacionWords,
    lessonXp: game.lesson[0]?.xpReward ?? null,
    lessonCount: game._count.lesson,
  }));

  const quizLessonsView: PreguntasLessonViewModel[] = quizLessons.map((l) => ({
    id: l.id,
    title: l.title,
    emoji: l.emoji,
    type: l.type as PreguntasLessonViewModel["type"],
    optionMode: l.optionMode ?? "TEXT",
    timeSeconds: l.timeSeconds,
    xpReward: l.xpReward,
    questionCount: l._count.questions,
    language: l.language ?? "es",
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/admin/settings"
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 transition hover:text-green-600 dark:text-zinc-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a Configuración
      </Link>
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">
          Configurador de lecciones
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cada lección es un juego del camino con sus propias palabras y XP.
        </p>
      </div>
      <JuegosManager games={gamesView} clases={clases} quizzLessons={quizLessonsView} />
    </div>
  );
}