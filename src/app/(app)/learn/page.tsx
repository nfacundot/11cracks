import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import LearnStages, { type EtapaData } from "@/components/learn-stages";

export const metadata = { title: "Aprender" };

export default async function LearnPage() {
  const user = await requireUser();

  const etapas = await prisma.etapa.findMany({
    orderBy: { order: "asc" },
    include: {
      materias: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { gameMode: { not: "INFOGRAMA" } },
            orderBy: { order: "asc" },
            include: {
              questions: { select: { id: true } },
              progress: { where: { userId: user.id } },
            },
          },
        },
      },
    },
  });

  const unassignedMaterias = await prisma.materia.findMany({
    where: { etapaId: null },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        where: { gameMode: { not: "INFOGRAMA" } },
        orderBy: { order: "asc" },
        include: {
          questions: { select: { id: true } },
          progress: { where: { userId: user.id } },
        },
      },
    },
  });

  const toAsignaturaData = (materia: {
    id: string;
    order: number;
    name: string;
    emoji: string;
    color: string;
    xpReward: number;
    posX: number;
    posY: number;
    lessons: {
      id: string;
      order: number;
      title: string;
      emoji: string;
      color: string;
      type: string;
      xpReward: number;
      questions: { id: string }[];
      progress: { completed: boolean; bestScore: number }[];
    }[];
  }) => ({
    id: materia.id,
    order: materia.order,
    title: materia.name,
    emoji: materia.emoji,
    color: materia.color,
    xpReward: materia.xpReward,
    posX: materia.posX,
    posY: materia.posY,
    lessons: materia.lessons.map((lesson) => {
      const progress = lesson.progress[0];
      return {
        id: lesson.id,
        order: lesson.order,
        title: lesson.title,
        emoji: lesson.emoji,
        color: lesson.color,
        type: lesson.type,
        xpReward: lesson.xpReward,
        questionCount: lesson.questions.length,
        started: Boolean(progress),
        completed: Boolean(progress?.completed),
        bestScore: progress?.bestScore ?? 0,
      };
    }),
  });

  const data: EtapaData[] = [
    ...etapas.map((etapa) => ({
      id: etapa.id,
      name: etapa.name,
      emoji: etapa.emoji,
      color: etapa.color,
      order: etapa.order,
      asignaturas: etapa.materias.map(toAsignaturaData),
    })),
    ...(unassignedMaterias.length > 0
      ? [
          {
            id: "sin-etapa",
            name: "General",
            emoji: "🗺️",
            color: "#16a34a",
            order: 999,
            asignaturas: unassignedMaterias.map(toAsignaturaData),
          },
        ]
      : []),
  ];

  const allLessons = data.flatMap((e) => e.asignaturas.flatMap((m) => m.lessons));

  return (
    <LearnStages
      etapas={data}
      totalCompleted={allLessons.filter((l) => l.completed).length}
      totalLessons={allLessons.length}
    />
  );
}
