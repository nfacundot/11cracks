import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PlayerProgress } from "@/components/player/player-progress";
import { buildPlayerProgressFixture, type PlayerProgressRacha } from "@/lib/player/progress";
import { nextMilestoneFromStreak } from "@/lib/player/metrics";

export const metadata = { title: "Mi Progreso" };

export default async function ProgressPage() {
  const user = await requireUser();

  const [indicators, lastActive] = await Promise.all([
    prisma.indicator.findMany({
      where: { userId: user.id },
      orderBy: { percentage: "desc" },
      select: { name: true, percentage: true, category: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { lastActiveAt: true },
    }),
  ]);

  const racha: PlayerProgressRacha = {
    state: user.currentStreak > 0 ? "ACTIVA" : "SIN_RACHA",
    currentStreak: user.currentStreak,
    bestStreak: user.bestStreak,
    lastVerifiedActivityDate: lastActive?.lastActiveAt ? lastActive.lastActiveAt.toISOString().slice(0, 10) : undefined,
    nextMilestone: nextMilestoneFromStreak(user.currentStreak),
    explanation: user.currentStreak > 0
      ? `Llevas ${user.currentStreak} días consecutivos de actividad validada.`
      : "Completa una actividad hoy y comienza tu racha. Cada día suma al hito de 7 días.",
  };

  const fixture = buildPlayerProgressFixture({ indicators, currentStreak: user.currentStreak, bestStreak: user.bestStreak });

  return <PlayerProgress fixture={fixture} racha={racha} />;
}