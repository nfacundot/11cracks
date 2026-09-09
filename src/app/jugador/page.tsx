import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PlayerDashboard, type PlayerDashboardPending, type PlayerDashboardCard, type PlayerDashboardVideo } from "@/components/player/player-dashboard";
import type { PlayerHomeEvolution } from "@/components/player/player-evolution-preview";
import { seriesFor, buildRpgData } from "@/lib/player/metrics";

export const metadata = { title: "Inicio" };

export default async function JugadorHomePage() {
  const user = await requireUser();

  const [indicators, membership, lessons, progressRows] = await Promise.all([
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
    prisma.lesson.findMany({
      orderBy: [{ type: "asc" }, { order: "asc" }],
      select: { id: true, title: true, type: true },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      select: { lessonId: true },
    }),
  ]);

  const completedIds = new Set(progressRows.map((row) => row.lessonId));
  const completedLessons = completedIds.size;
  const nextLesson = lessons.find((lesson) => !completedIds.has(lesson.id));

  const clubName = membership?.team.name;
  const scopeLabel = clubName ?? "Jugador — 11 Cracks";

  const hasProgress = indicators.length > 0 || completedLessons > 0;
  const nextStep = hasProgress
    ? { kind: "continue", title: "Continúa tu formación", description: "Retoma tu aprendizaje y suma XP.", actionLabel: "Continuar", href: "/jugador/neurocracks/bilinguismo/gol-de-palabra" }
    : { kind: "start", title: "Empieza tu recorrido", description: "Completa tu primera lección y enciende tu racha.", actionLabel: "Empezar", href: "/jugador/neurocracks/bilinguismo/gol-de-palabra" };

  const nextMilestone = user.currentStreak > 0 ? (Math.floor(user.currentStreak / 7) + 1) * 7 : null;

  const pending: PlayerDashboardPending[] = [];
  if (nextLesson) {
    pending.push({
      id: `lesson-${nextLesson.id}`,
      actionLabel: "ACTIVIDAD",
      title: nextLesson.title,
      description: "Completa esta lección para sumar XP.",
      href: "/jugador/neurocracks",
    });
  }
  if (nextMilestone) {
    pending.push({
      id: "streak-milestone",
      actionLabel: "RACHA",
      title: "Alcanza tu próximo hito",
      description: `Faltan ${nextMilestone - user.currentStreak} días para el hito de ${nextMilestone} días.`,
      href: "/jugador/progress",
    });
  }
  if (user.bestStreak > 0) {
    pending.push({
      id: "best-record",
      actionLabel: "RÉCORD",
      title: "Supera tu mejor racha",
      description: `Tu mejor marca es ${user.bestStreak} días.`,
      href: "/jugador/progress",
    });
  }

  const racha = {
    streak: user.currentStreak,
    best: user.bestStreak,
    state: user.currentStreak > 0 ? "Activa" : "Sin racha",
    nextMilestone,
  };

  const evolution: PlayerHomeEvolution = {
    sport: seriesFor("DEPORTE", indicators),
    neurocracks: seriesFor("NEUROCRACKS", indicators),
  };

  const card: PlayerDashboardCard = {
    state: "next",
    eyebrow: "TU PRÓXIMA CARTA",
    badge: "En camino",
    rarity: "Por descubrir",
    category: "Camino de Crack",
    title: "Tu próxima recompensa",
    reason: "Sigue con tu actividad validada para acercarte.",
    progress: null,
    href: "/jugador/progress",
    ctaLabel: "Ver progreso",
  };

  const video: PlayerDashboardVideo = {
    state: "empty",
  };

  return (
    <PlayerDashboard
      name={user.name}
      avatarUrl={user.avatarUrl}
      position={user.position}
      scopeLabel={scopeLabel}
      evolution={evolution}
      racha={racha}
      hours={null}
      nextStep={nextStep}
      pending={pending}
      rpg={buildRpgData(user.xp, user.currentStreak, user.bestStreak)}
      card={card}
      video={video}
    />
  );
}