import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LessonPlayer } from "@/components/lesson-player";

export const metadata = { title: "Lección" };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      game: { select: { slug: true } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!lesson) notFound();

  // Si la lección está vinculada a un juego (Game), abre la experiencia del
  // juego en lugar del reproductor de preguntas. La detección usa SOLO la
  // relación con `Game`; una lección homónima sin vincular sigue siendo lección.
  if (lesson.game) {
    redirect(`/jugador/neurocracks/bilinguismo/${encodeURIComponent(lesson.game.slug)}?lesson=${encodeURIComponent(id)}`);
  }

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
    <div className="pt-2">
      <LessonPlayer lesson={playerLesson} questions={questions} />
    </div>
  );
}
