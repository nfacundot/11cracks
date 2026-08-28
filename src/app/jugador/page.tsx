import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PlayerHome, type PlayerHomeMetric } from "@/components/player/player-home";
import type { PlayerHomeEvolution } from "@/components/player/player-evolution-preview";
import type { PlayerRpgData } from "@/components/player/player-rpg-home";

export const metadata = { title: "Inicio" };

const HERO = {
  src: "/scenes/player/candidates/player-threshold-stadium-candidate-01.png",
  focal: { x: 0.66, y: 0.5 },
  mobileFocal: { x: 0.7, y: 0.44 },
};

type IndicatorRow = { name: string; percentage: number; category: string };

function axisFromValues(values: number[]): [number, number, number, number, number, number] {
  const filled = [...values];
  while (filled.length < 6) filled.push(0);
  return [filled[0], filled[1], filled[2], filled[3], filled[4], filled[5]].map((v) =>
    Math.max(0, Math.min(100, Math.round(v) || 0)),
  ) as [number, number, number, number, number, number];
}

function seriesFor(category: string, indicators: IndicatorRow[]) {
  const rows = indicators.filter((i) => i.category === category).sort((a, b) => b.percentage - a.percentage).slice(0, 6);
  const current = axisFromValues(rows.map((r) => r.percentage));
  const previous = axisFromValues(rows.map((r) => Math.max(0, r.percentage - 15)));
  return { label: category === "NEUROCRACKS" ? "NeuroCracks" : "Deporte", current, previous };
}

function levelInfo(xp: number) {
  let level = 1;
  let cumulative = 0;
  while (cumulative + level * 200 <= xp) {
    cumulative += level * 200;
    level += 1;
  }
  const xpToNext = cumulative + level * 200;
  return { level, xpToNext };
}

const REWARD_TITLES: Record<number, string> = {
  10: "Kit del primer hito",
  15: "Camiseta conmemorativa",
  20: "Sesión con el equipo",
  25: "Reconocimiento del club",
  30: "Experiencia premium",
};

function rpgData(xp: number, currentStreak: number, bestStreak: number): PlayerRpgData {
  const { level, xpToNext } = levelInfo(xp);
  const nextMilestone = Math.max(10, (Math.floor(currentStreak / 5) + 1) * 5);
  return {
    level,
    xp,
    xpToNext,
    streakCurrent: currentStreak,
    streakBest: bestStreak,
    nextMilestone,
    nextRewardTitle: REWARD_TITLES[nextMilestone] ?? "Nueva recompensa",
  };
}

export default async function JugadorHomePage() {
  const user = await requireUser();

  const [indicators, membership, lessonProgress] = await Promise.all([
    prisma.indicator.findMany({
      where: { userId: user.id },
      orderBy: { percentage: "desc" },
      select: { name: true, percentage: true, category: true },
    }),
    prisma.teamMember.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: "asc" },
      select: { team: { select: { name: true } } },
    }),
    prisma.lessonProgress.count({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
    }),
  ]);

  const clubName = membership?.team.name;
  const scopeLabel = clubName ?? "Jugador — 11 Cracks";

  const metrics: [PlayerHomeMetric, PlayerHomeMetric, PlayerHomeMetric] = [
    { id: "consistency", icon: "achievements", label: "Racha actual", value: String(user.currentStreak), detail: `${user.currentStreak === 1 ? "día" : "días"}` },
    { id: "xp", icon: "progress", label: "XP total", value: String(user.xp) },
    { id: "lessons", icon: "training", label: "Lecciones", value: String(lessonProgress), detail: "completadas" },
  ];

  const hasProgress = indicators.length > 0 || lessonProgress > 0;
  const nextStep = hasProgress
    ? { title: "Continúa tu formación", description: "Retoma tu aprendizaje y suma puntos.", actionLabel: "Continuar", href: "/jugador/neurocracks" }
    : { title: "Sigue creciendo hoy", description: "Explora una lección y continúa tu formación.", actionLabel: "Ir a estudiar", href: "/jugador/neurocracks" };

  const racha = {
    streak: user.currentStreak,
    best: user.bestStreak,
    state: user.currentStreak > 0 ? "Activa" : "Sin racha",
    explanation:
      user.currentStreak > 0
        ? `Llevas ${user.currentStreak} ${user.currentStreak === 1 ? "día" : "días"} consecutivos. Tu mejor marca es ${user.bestStreak}.`
        : "Completa lecciones a diario para encender tu racha.",
    nextMilestone: user.currentStreak > 0 ? (Math.floor(user.currentStreak / 7) + 1) * 7 : null,
  };

  const evolution: PlayerHomeEvolution = {
    sport: seriesFor("DEPORTE", indicators),
    neurocracks: seriesFor("NEUROCRACKS", indicators),
  };

  return (
    <PlayerHome
      name={user.name}
      avatarUrl={user.avatarUrl}
      roleLabel="Jugador"
      scopeLabel={scopeLabel}
      heroSrc={HERO.src}
      focal={HERO.focal}
      mobileFocal={HERO.mobileFocal}
      nextStep={nextStep}
      racha={racha}
      metrics={metrics}
      evolution={evolution}
      rpg={rpgData(user.xp, user.currentStreak, user.bestStreak)}
    />
  );
}
