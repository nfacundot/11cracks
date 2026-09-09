"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { touchStreak } from "@/lib/streak";
import { notify } from "@/lib/notify";
import { revalidatePath } from "next/cache";

type ActionResult =
  | { ok: true; correct: boolean; explanation?: string | null; correctOptionId?: string }
  | { ok: false; error: string };

export async function submitAnswer(data: {
  lessonId: string;
  questionId: string;
  optionId: string;
}): Promise<ActionResult> {
  const user = await requireUser();

  const question = await prisma.question.findUnique({
    where: { id: data.questionId },
    include: { options: true },
  });

  if (!question || question.lessonId !== data.lessonId) {
    return { ok: false, error: "Pregunta no válida" };
  }

  const option = question.options.find((o) => o.id === data.optionId);
  if (!option) {
    return { ok: false, error: "Opción no válida" };
  }

  const correct = option.isCorrect;

  await prisma.$transaction(async (tx) => {
    await tx.answerRecord.create({
      data: { userId: user.id, questionId: question.id, isCorrect: correct },
    });
    await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: data.lessonId } },
      create: { userId: user.id, lessonId: data.lessonId, status: "IN_PROGRESS", attempts: 1 },
      update: { status: "IN_PROGRESS" },
    });
  });

  revalidatePath("/jugador/neurocracks");

  return {
    ok: true,
    correct,
    explanation: question.explanation,
    correctOptionId: correct ? undefined : question.options.find((o) => o.isCorrect)?.id,
  };
}

export type FinishLessonResult =
  | { ok: true; earnedXp: number; perfect: boolean; totalXp: number; levelUp: boolean; streak: number }
  | { ok: false; error: string };

export async function finishLesson(data: {
  lessonId: string;
  correctCount: number;
  totalCount: number;
}): Promise<FinishLessonResult> {
  const user = await requireUser();

  const lesson = await prisma.lesson.findUnique({ where: { id: data.lessonId } });
  if (!lesson) {
    return { ok: false, error: "Lección no encontrada" };
  }

  const totalCount = Math.max(1, data.totalCount);
  const correctCount = Math.min(data.correctCount, totalCount);
  const perfect = correctCount === totalCount;

  const prev = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId: data.lessonId } },
  });

  let grant = 0;
  if (!prev?.completed) {
    grant = perfect ? lesson.xpReward : Math.max(1, Math.round((correctCount / totalCount) * lesson.xpReward));
  } else if (correctCount > prev.bestScore) {
    const improvement = Math.round(((correctCount - prev.bestScore) / totalCount) * lesson.xpReward);
    grant = Math.max(1, improvement);
  }

  const beforeLevel = Math.floor(user.xp / 100) + 1;

  await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId: data.lessonId } },
      create: {
        userId: user.id,
        lessonId: data.lessonId,
        status: "COMPLETED",
        bestScore: correctCount,
        attempts: 1,
        completed: true,
        completedAt: new Date(),
      },
      update: {
        status: "COMPLETED",
        bestScore: Math.max(prev?.bestScore ?? 0, correctCount),
        attempts: { increment: 1 },
        completed: true,
        completedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: user.id },
      data: { xp: { increment: grant } },
    });
  });

  const streak = await touchStreak(user.id);
  const totalXp = user.xp + grant;
  const afterLevel = Math.floor(totalXp / 100) + 1;
  const levelUp = afterLevel > beforeLevel;

  if (perfect) {
    await notify(
      user.id,
      "LESSON",
      "¡Lección perfecta! 🎯",
      `Completaste "${lesson.title}" sin fallar y ganaste ${lesson.xpReward} XP.`,
      { icon: "🏅", link: "/jugador/learn" }
    );
  } else if (grant > 0) {
    await notify(
      user.id,
      "XP",
      "Lección completada",
      `Ganaste ${grant} XP en "${lesson.title}".`,
      { icon: lesson.emoji, link: "/jugador/learn" }
    );
  }

  if (levelUp) {
    await notify(
      user.id,
      "XP",
      `¡Subiste al nivel ${afterLevel}! 🚀`,
      "Sigue entrenando para desbloquear más contenido.",
      { icon: "🚀", link: "/jugador/learn" }
    );
  }

  revalidatePath("/jugador/neurocracks");

  return {
    ok: true,
    earnedXp: grant,
    perfect,
    totalXp,
    levelUp,
    streak: streak.currentStreak,
  };
}
