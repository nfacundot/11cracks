import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PlayerProgress } from "@/components/player/player-progress";
import { buildPlayerProgressFixture, type PlayerProgressRacha } from "@/lib/player/progress";
import { nextMilestoneFromStreak } from "@/lib/player/metrics";

export const metadata = { title: "Mi Progreso" };

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function shortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-CO", { month: "short" })
    .format(new Date(date.getFullYear(), date.getMonth(), 1))
    .replace(".", "");
}

export default async function ProgressPage() {
  const user = await requireUser();

  const today = new Date();
  const thirtyDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
  const since = new Date(today.getFullYear(), today.getMonth() - 4, 1);

  const [indicators, lastActive, completedLessons, completedCount, lessonTotal, answerAgg, correctAnswers, sessions, attendanceDays, streakDates] =
    await Promise.all([
      prisma.indicator.findMany({
        where: { userId: user.id },
        orderBy: { percentage: "desc" },
        select: { name: true, percentage: true, category: true },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { lastActiveAt: true },
      }),
      prisma.lessonProgress.findMany({
        where: { userId: user.id, completed: true, completedAt: { gte: since } },
        orderBy: { completedAt: "desc" },
        select: {
          completedAt: true,
          lesson: { select: { title: true, emoji: true, tema: { select: { name: true, emoji: true } } } },
        },
      }),
      prisma.lessonProgress.count({ where: { userId: user.id, completed: true } }),
      prisma.lesson.count({ where: { type: "LESSON" } }),
      prisma.answerRecord.aggregate({
        where: { userId: user.id },
        _count: { _all: true },
      }),
      prisma.answerRecord.count({ where: { userId: user.id, isCorrect: true } }),
      prisma.gameSession.findMany({
        where: { userId: user.id, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      prisma.streakDay.count({ where: { userId: user.id, date: { gte: thirtyDaysAgo } } }),
      prisma.streakDay.findMany({
        where: { userId: user.id },
        orderBy: { date: "desc" },
        take: 5,
        select: { date: true },
      }),
    ]);

  const attendancePercent = Math.min(100, Math.round((attendanceDays / 30) * 100));

  const lessonsByMonth = new Map<string, number>();
  for (const lesson of completedLessons) {
    if (!lesson.completedAt) continue;
    if (lesson.completedAt < since) continue;
    const key = monthKey(lesson.completedAt);
    lessonsByMonth.set(key, (lessonsByMonth.get(key) ?? 0) + 1);
  }
  const sessionsByMonth = new Map<string, number>();
  for (const session of sessions) {
    const key = monthKey(session.createdAt);
    sessionsByMonth.set(key, (sessionsByMonth.get(key) ?? 0) + 1);
  }

  const monthActivity: { label: string; value: number }[] = [];
  let maxActivity = 0;
  for (let i = 4; i >= 0; i -= 1) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = monthKey(month);
    const activity = (lessonsByMonth.get(key) ?? 0) + (sessionsByMonth.get(key) ?? 0);
    maxActivity = Math.max(maxActivity, activity);
    monthActivity.push({ label: shortMonthLabel(month), value: activity });
  }
  const trendPoints = maxActivity > 0
    ? monthActivity.map((item) => ({ label: item.label, value: Math.round((item.value / maxActivity) * 100) }))
    : undefined;

  const evaluations = completedLessons.map((lesson) => ({
    title: lesson.lesson.title,
    context: lesson.lesson.tema
      ? `${lesson.lesson.tema.emoji} ${lesson.lesson.tema.name} · NeuroCracks`
      : `Lección ${lesson.lesson.emoji} · NeuroCracks`,
    at: lesson.completedAt ?? new Date(),
  }));

  const accuracy = answerAgg._count._all > 0
    ? { correct: correctAnswers, total: answerAgg._count._all }
    : undefined;

  const lastVerified = streakDates[0]?.date ?? lastActive?.lastActiveAt;

  const racha: PlayerProgressRacha = {
    state: user.currentStreak > 0 ? "ACTIVA" : "SIN_RACHA",
    currentStreak: user.currentStreak,
    bestStreak: user.bestStreak,
    lastVerifiedActivityDate: lastVerified ? lastVerified.toISOString().slice(0, 10) : undefined,
    nextMilestone: nextMilestoneFromStreak(user.currentStreak),
    explanation: user.currentStreak > 0
      ? `Llevas ${user.currentStreak} días consecutivos de actividad validada.`
      : "Completa una actividad hoy y comienza tu racha. Cada día suma al hito de 7 días.",
  };

  const fixture = buildPlayerProgressFixture({
    indicators,
    currentStreak: user.currentStreak,
    bestStreak: user.bestStreak,
    evaluations,
    trendPoints,
    attendancePercent,
    accuracy,
    completedLessons: completedCount,
    lessonTotal,
  });

  return <PlayerProgress fixture={fixture} racha={racha} />;
}