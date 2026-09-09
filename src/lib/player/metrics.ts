import "server-only";

import type { PlayerRpgData } from "@/components/player/player-rpg-home";

export type IndicatorRow = { name: string; percentage: number; category: string };

const DEMO_AXES = {
  DEPORTE: {
    current: [78, 62, 88, 70, 82, 58],
    previous: [66, 50, 74, 56, 68, 45],
  },
  NEUROCRACKS: {
    current: [62, 74, 58, 68, 80, 64],
    previous: [50, 60, 44, 54, 66, 50],
  },
} as const;

export function axisFromValues(values: number[]): [number, number, number, number, number, number] {
  const filled = [...values];
  while (filled.length < 6) filled.push(0);
  return [filled[0], filled[1], filled[2], filled[3], filled[4], filled[5]].map((v) =>
    Math.max(0, Math.min(100, Math.round(v) || 0)),
  ) as [number, number, number, number, number, number];
}

export function seriesFor(category: string, indicators: IndicatorRow[]) {
  const demo = DEMO_AXES[category as keyof typeof DEMO_AXES] ?? DEMO_AXES.DEPORTE;
  const rows = indicators.filter((i) => i.category === category).sort((a, b) => b.percentage - a.percentage).slice(0, 6);
  const currentValues: number[] = [];
  const previousValues: number[] = [];
  rows.forEach((row) => {
    currentValues.push(row.percentage);
    previousValues.push(Math.max(0, row.percentage - 15));
  });
  let index = currentValues.length;
  while (index < 6) {
    currentValues.push(demo.current[index]);
    previousValues.push(demo.previous[index]);
    index += 1;
  }
  return { label: category === "NEUROCRACKS" ? "NeuroCracks" : "Deporte", current: axisFromValues(currentValues), previous: axisFromValues(previousValues) };
}

export function levelInfo(xp: number) {
  let level = 1;
  let cumulative = 0;
  while (cumulative + level * 200 <= xp) {
    cumulative += level * 200;
    level += 1;
  }
  const xpToNext = cumulative + level * 200;
  return { level, xpToNext };
}

export const REWARD_TITLES: Record<number, string> = {
  10: "Kit del primer hito",
  15: "Camiseta conmemorativa",
  20: "Sesión con el equipo",
  25: "Reconocimiento del club",
  30: "Experiencia premium",
};

export function buildRpgData(xp: number, currentStreak: number, bestStreak: number): PlayerRpgData {
  const { level, xpToNext } = levelInfo(xp);
  const nextMilestone = Math.max(10, (Math.floor(currentStreak / 5) + 1) * 5);
  return {
    level,
    xp,
    xpToNext,
    streakCurrent: currentStreak,
    streakBest: bestStreak,
    streakProgress: Math.min(100, Math.round((currentStreak / Math.max(1, nextMilestone)) * 100)),
    nextMilestone,
    nextRewardTitle: REWARD_TITLES[nextMilestone] ?? "Nueva recompensa",
  };
}

export function nextMilestoneFromStreak(currentStreak: number): number {
  return currentStreak > 0 ? (Math.floor(currentStreak / 7) + 1) * 7 : 7;
}