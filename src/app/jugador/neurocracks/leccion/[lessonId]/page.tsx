import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LessonPlayer } from "@/components/lesson-player";

export const metadata = { title: "Lección · El Camino" };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function ElCaminoLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const user = await requireUser();
  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      tema: { select: { id: true, clases: { select: { id: true } } } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!lesson) notFound();

  const temaClaseIds = lesson.tema?.clases.map((c) => c.id) ?? [];
  if (!lesson.tema || temaClaseIds.length === 0) {
    redirect("/jugador/neurocracks");
  }

  const clasesPath = await prisma.clase.findMany({
    where: { id: { in: temaClaseIds } },
    select: {
      temas: {
        orderBy: { order: "asc" },
        select: {
          lessons: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            select: { id: true },
          },
        },
      },
    },
  });

  const pathLessonIds = [
    ...new Set(clasesPath.flatMap((c) => c.temas.flatMap((t) => t.lessons.map((l) => l.id)))),
  ];
  const progressList = pathLessonIds.length
    ? await prisma.lessonProgress.findMany({
        where: { userId: user.id, lessonId: { in: pathLessonIds } },
        select: { lessonId: true, completed: true },
      })
    : [];
  const completedMap = new Map(progressList.map((p) => [p.lessonId, p.completed]));

  const unlocked = clasesPath.some((clase) => {
    const ids = clase.temas.flatMap((t) => t.lessons.map((l) => l.id));
    const firstIncomplete = ids.findIndex((id) => !completedMap.get(id));
    return completedMap.get(lesson.id) === true || ids.indexOf(lesson.id) === firstIncomplete;
  });

  if (!unlocked) redirect("/jugador/neurocracks");

  if (lesson.gameMode === "INFOGRAMA") {
    redirect("/jugador/game/infograma");
  }
  if (lesson.gameMode === "ANAGRAM") {
    redirect("/jugador/game/word");
  }

  const questions = lesson.questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    explanation: q.explanation,
    timeSeconds: q.timeSeconds,
    options: shuffle(q.options.map((o) => ({ id: o.id, text: o.text, imageUrl: o.imageUrl }))),
  }));

  const playerLesson = {
    id: lesson.id,
    title: lesson.title,
    emoji: lesson.emoji,
    xpReward: lesson.xpReward,
    type: lesson.type,
    optionMode: lesson.optionMode,
    timeSeconds: lesson.timeSeconds,
  };

  return (
    <div className="el-camino-lesson">
      <header className="el-camino-lesson__bar">
        <Link href="/jugador/neurocracks" className="el-camino-lesson__brand" aria-label="Volver a El Camino">
          <span>EL CAMINO</span>
        </Link>
        <Link href="/jugador/neurocracks" className="el-camino-lesson__exit" aria-label="Salir y guardar progreso">
          <span>Salir</span>
          <i aria-hidden="true">×</i>
        </Link>
      </header>
      <div className="el-camino-lesson__stage">
        <LessonPlayer lesson={playerLesson} questions={questions} returnHref="/jugador/neurocracks" />
      </div>
    </div>
  );
}