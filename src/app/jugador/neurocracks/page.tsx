import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEtapaLayouts } from "@/lib/el-camino/layout";
import { ElCaminoHome } from "@/components/player/el-camino-home";
import type { ClaseCamino, NodoLeccionEstado } from "@/lib/el-camino/lecciones";

export const metadata = { title: "El Camino" };

export default async function Page() {
  const user = await requireUser();

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
              posX: true,
              posY: true,
              questions: { select: { id: true }, orderBy: { order: "asc" } },
              progress: { where: { userId: user.id }, select: { status: true, completed: true, bestScore: true } },
            },
          },
        },
      },
    },
  });

  const layouts = await getEtapaLayouts(clasesRaw.map((c) => c.id));

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
      }))
    );
    const firstIncompleteIndex = rows.findIndex((row) => !row.completed);

    const stages = clase.temas
      .filter((tema) => tema.lessons.length > 0)
      .map((tema) => {
        const nodes = tema.lessons.map((lesson) => {
          const row = rows.find((candidate) => candidate.lesson.id === lesson.id);
          if (!row) return null;
          const position = rows.indexOf(row);
          let estado: NodoLeccionEstado;
          if (row.completed) {
            estado = "COMPLETED";
          } else if (position === firstIncompleteIndex) {
            estado = row.progress?.status === "IN_PROGRESS" ? "IN_PROGRESS" : "AVAILABLE";
          } else if (position < firstIncompleteIndex) {
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
      stages: stages.filter((stage) => stage.nodes.length > 0),
    };
  });

  return <ElCaminoHome playerId={user.id} caminos={caminos} />;
}