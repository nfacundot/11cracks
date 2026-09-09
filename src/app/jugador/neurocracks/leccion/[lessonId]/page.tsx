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
  await requireUser();
  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!lesson) notFound();

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