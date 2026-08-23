"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { touchStreak } from "@/lib/streak";
import { notify } from "@/lib/notify";

export type GameResult =
  | { ok: true; xpGained: number; bestScore: boolean }
  | { ok: false; error: string };

const GAME_NAMES: Record<string, string> = {
  WORD_GOAL: "Palabra a Gol",
  INFOGRAMA: "Infograma",
};

export async function recordGameScore(gameType: string, score: number): Promise<GameResult> {
  const user = await requireUser();

  if (typeof gameType !== "string" || !gameType.trim()) {
    return { ok: false, error: "Tipo de juego inválido" };
  }
  const safeScore = Math.max(0, Math.round(Number(score) || 0));

  await prisma.gameSession.create({
    data: { userId: user.id, gameType, score: safeScore },
  });

  const xpGained = safeScore * 5;
  await prisma.user.update({
    where: { id: user.id },
    data: { xp: { increment: xpGained } },
  });

  await touchStreak(user.id);

  await notify(
    user.id,
    "GAME",
    "¡Partido jugado! ⚽",
    `Terminaste ${GAME_NAMES[gameType] ?? gameType} con ${safeScore} puntos. Ganaste ${xpGained} XP.`,
    { icon: "🎮", link: "/jugador/games" }
  );

  return { ok: true, xpGained, bestScore: safeScore > 0 };
}

export type MemoryLevelResult =
  | { ok: true; bonusXp: number; unlockedNew: boolean }
  | { ok: false; error: string };

const MEMORY_LEVELS = [1, 2, 3] as const;

export async function recordMemoryLevel(level: number): Promise<MemoryLevelResult> {
  const user = await requireUser();

  const safe = MEMORY_LEVELS.includes(level as (typeof MEMORY_LEVELS)[number]) ? level : 0;
  if (!safe) return { ok: false, error: "Nivel inválido" };

  const best = await prisma.gameSession.findFirst({
    where: { userId: user.id, gameType: "MEMORY_LEVEL" },
    orderBy: { score: "desc" },
    select: { score: true },
  });
  const prevBest = best?.score ?? 0;

  await prisma.gameSession.create({
    data: { userId: user.id, gameType: "MEMORY_LEVEL", score: safe },
  });

  let bonusXp = 0;
  if (safe === 3 && prevBest < 3) {
    bonusXp = 30;
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: bonusXp } },
    });
  }

  return { ok: true, bonusXp, unlockedNew: safe > prevBest };
}
