"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { finishLesson } from "@/actions/lesson";
import type { BilingualJourneyProgress } from "@/lib/bilingual/game-contracts";

export async function saveBilingualProgress(journey: BilingualJourneyProgress): Promise<void> {
  const user = await requireUser();
  if (journey.playerId !== user.id) throw new Error("Solo puedes guardar tu propio progreso de aprendizaje.");
}

export type SubmitBilingualGameResultResult =
  | { ok: true; earnedXp: number; perfect: boolean; streak: number }
  | { ok: false; error: string };

export async function submitBilingualGameResult(data: {
  gameId: string;
  resolved: number;
  unresolved: number;
}): Promise<SubmitBilingualGameResultResult> {
  await requireUser();

  const game = await prisma.game.findFirst({
    where: { OR: [{ id: data.gameId }, { slug: data.gameId }] },
    select: { lesson: { select: { id: true } } },
  });
  if (!game?.lesson) return { ok: false, error: "Este juego no tiene una lección vinculada." };

  const totalCount = data.resolved + data.unresolved;
  const result = await finishLesson({
    lessonId: game.lesson.id,
    correctCount: data.resolved,
    totalCount,
  });
  if (!result.ok) return { ok: false, error: result.error };

  return {
    ok: true,
    earnedXp: result.earnedXp,
    perfect: result.perfect,
    streak: result.streak,
  };
}