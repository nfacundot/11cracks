import "server-only";

import { prisma } from "@/lib/prisma";
import { getEtapaLayouts } from "@/lib/el-camino/layout";
import type { ClaseCamino, NodoLeccionEstado } from "@/lib/el-camino/lecciones";

export async function getNeurocracksData(userId: string): Promise<{ playerId: string; caminos: ClaseCamino[] }> {
  const clasesRaw = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      emoji: true,
      color: true,
      order: true,
      temas: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          name: true,
          emoji: true,
          color: true,
          xpReward: true,
          posX: true,
          posY: true,
          lessons: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              emoji: true,
              color: true,
              xpReward: true,
              description: true,
              type: true,
              posX: true,
              posY: true,
              game: { select: { slug: true, name: true, category: true } },
              questions: { select: { id: true }, orderBy: { order: "asc" } },
              progress: { where: { userId }, select: { status: true, completed: true, bestScore: true } },
            },
          },
        },
      },
    },
  });

  const layouts = await getEtapaLayouts(clasesRaw.map((c) => c.id));

  const globalRows = clasesRaw.flatMap((clase) =>
    clase.temas.flatMap((tema) =>
      tema.lessons.map((lesson) => ({
        lessonId: lesson.id,
        completed: Boolean(lesson.progress[0]?.completed),
      })),
    ),
  );
  const globalFirstIncomplete = globalRows.findIndex((row) => !row.completed);
  const globalPosByLesson = new Map(globalRows.map((row, index) => [row.lessonId, index]));

  const caminos: ClaseCamino[] = clasesRaw.map((clase) => {
    const layout = layouts.get(clase.id);
    const temaPos = layout?.temas;
    const lessonPos = layout?.lessons;
    const rows = clase.temas.flatMap((tema) =>
      tema.lessons.map((lesson) => ({
        tema,
        lesson,
        progress: lesson.progress[0] ?? null,
        completed: Boolean(lesson.progress[0]?.completed),
      })),
    );

    const stages = clase.temas.map((tema) => {
      const nodes = tema.lessons.map((lesson) => {
        const row = rows.find((candidate) => candidate.lesson.id === lesson.id);
        if (!row) return null;
        const position = rows.indexOf(row);
        const globalIndex = globalPosByLesson.get(lesson.id) ?? -1;
        let estado: NodoLeccionEstado;
        if (row.completed) {
          estado = "COMPLETED";
        } else if (globalIndex === globalFirstIncomplete) {
          estado = row.progress?.status === "IN_PROGRESS" ? "IN_PROGRESS" : "AVAILABLE";
        } else if (globalIndex < globalFirstIncomplete) {
          estado = "COMPLETED";
        } else {
          estado = "LOCKED";
        }
        return {
          id: lesson.id,
          order: position + 1,
          title: lesson.title,
          emoji: lesson.emoji,
          color: lesson.color,
          xpReward: lesson.xpReward,
          questionCount: lesson.questions.length,
          description: lesson.description,
          estado,
          bestScore: row.progress?.bestScore ?? 0,
          gameSlug: lesson.game?.slug ?? null,
          gameLabel: lesson.game?.name ?? null,
          gameCategory: lesson.game?.category ?? null,
          lessonType: lesson.type,
          posX: lessonPos?.get(lesson.id)?.posX ?? lesson.posX,
          posY: lessonPos?.get(lesson.id)?.posY ?? lesson.posY,
        };
      });

      const mPos = temaPos?.get(tema.id) ?? { posX: tema.posX, posY: tema.posY };
      return {
        id: tema.id,
        order: tema.order,
        title: tema.name,
        emoji: tema.emoji,
        color: tema.color,
        xpReward: tema.xpReward,
        posX: mPos.posX,
        posY: mPos.posY,
        nodes: nodes.filter((node) => node !== null),
      };
    });

    return {
      id: clase.id,
      name: clase.name,
      description: clase.description,
      emoji: clase.emoji,
      color: clase.color,
      order: clase.order,
      stages,
    };
  });

  return { playerId: userId, caminos };
}
