import { prisma } from "@/lib/prisma";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Registra una visita diaria del usuario y actualiza su racha.
 * - Sin actividad ayer y no hoy  -> racha nueva (1)
 * - Actividad ayer               -> racha +1
 * - Actividad hoy                -> sin cambios
 * - Última actividad hace más    -> racha reinicia en 1
 */
export async function touchStreak(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentStreak: true, bestStreak: true, lastActiveAt: true },
  });
  if (!user) return { currentStreak: 0, bestStreak: 0 };

  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  const last = user.lastActiveAt ? startOfDay(user.lastActiveAt) : null;

  let currentStreak = user.currentStreak;

  if (!last || last.getTime() < yesterday.getTime()) {
    currentStreak = 1;
  } else if (last.getTime() === yesterday.getTime()) {
    currentStreak = user.currentStreak + 1;
  }

  const existingDay = await prisma.streakDay.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  if (!existingDay) {
    await prisma.streakDay.create({ data: { userId, date: today } });
  }

  const bestStreak = Math.max(user.bestStreak, currentStreak);

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreak, bestStreak, lastActiveAt: new Date() },
  });

  return { currentStreak, bestStreak, isNewDay: !existingDay };
}

export function xpToLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function levelProgress(xp: number): { current: number; needed: number } {
  const inLevel = xp % 100;
  return { current: inLevel, needed: 100 };
}
