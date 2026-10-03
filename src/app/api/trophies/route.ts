import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { metricLabel, metricUnit, type TrophyProgress } from "@/lib/trophies";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ trophies: [] });
  }

  const [trophies, earned, pet, activeDays, lessonsCompleted, gameSessions] = await Promise.all([
    prisma.trophy.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.userTrophy.findMany({ where: { userId: user.id } }),
    prisma.petContribution.aggregate({
      where: { playerId: user.id },
      _sum: { bottlesCount: true, estimatedKg: true },
    }),
    prisma.streakDay.count({ where: { userId: user.id } }),
    prisma.lessonProgress.count({ where: { userId: user.id, completed: true } }),
    prisma.gameSession.count({ where: { userId: user.id } }),
  ]);

  const bottles = pet._sum.bottlesCount ?? 0;
  const kg = Number(pet._sum.estimatedKg ?? 0);
  const activity = lessonsCompleted + gameSessions + activeDays;

  const values: Record<string, number> = {
    impact: activity > 0 ? 1 : 0,
    sessions: lessonsCompleted,
    hours: lessonsCompleted,
    activeDays,
    streak: user.currentStreak,
    coins: user.coins,
    xp: user.xp,
    bottles,
    kg: Math.round(kg),
  };

  const earnedMap = new Map(earned.map((row) => [row.trophyId, row.earnedAt]));
  const toAward: string[] = [];

  const result: TrophyProgress[] = trophies.map((trophy) => {
    const raw = Math.max(0, Math.round(values[trophy.metric] ?? 0));
    const target = Math.max(1, trophy.target);
    const earnedAt = earnedMap.get(trophy.id) ?? null;
    const reached = raw >= target;
    if (!earnedAt && reached) toAward.push(trophy.id);
    return {
      id: trophy.id,
      name: trophy.name,
      subtitle: trophy.subtitle,
      description: trophy.description,
      icon: trophy.icon,
      metric: trophy.metric,
      metricLabel: metricLabel(trophy.metric),
      unit: metricUnit(trophy.metric),
      target,
      current: Math.min(raw, target),
      earned: Boolean(earnedAt) || reached,
      earnedAt: earnedAt ? earnedAt.toISOString() : null,
      percent: Math.min(100, Math.round((raw / target) * 100)),
    };
  });

  if (toAward.length > 0) {
    await prisma.userTrophy.createMany({
      data: toAward.map((trophyId) => ({ userId: user.id, trophyId })),
      skipDuplicates: true,
    });
    const total = await prisma.userTrophy.count({ where: { userId: user.id } });
    await prisma.user.update({ where: { id: user.id }, data: { trophies: total } });
  }

  return NextResponse.json({ trophies: result });
}
