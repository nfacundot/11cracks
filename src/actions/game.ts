"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { touchStreak } from "@/lib/streak";
import { notify } from "@/lib/notify";

export type GameResult =
  | { ok: true; xpGained: number; bestScore: boolean }
  | { ok: false; error: string };

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
    `Terminaste ${gameType} con ${safeScore} puntos. Ganaste ${xpGained} XP.`,
    { icon: "🎮", link: "/games" }
  );

  return { ok: true, xpGained, bestScore: safeScore > 0 };
}
