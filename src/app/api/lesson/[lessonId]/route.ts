import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      game: { select: { slug: true } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lección no encontrada" }, { status: 404 });
  }

  if (lesson.game) {
    return NextResponse.json({
      game: true,
      gameUrl: `/jugador/neurocracks/bilinguismo/${encodeURIComponent(lesson.game.slug)}?lesson=${encodeURIComponent(lesson.id)}`,
      title: lesson.title,
    });
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
    language: lesson.language ?? "es",
  };

  return NextResponse.json({ game: false, lesson: playerLesson, questions });
}
