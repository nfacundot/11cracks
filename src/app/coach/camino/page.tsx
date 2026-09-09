import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEtapaLayouts } from "@/lib/el-camino/layout";
import { ElCaminoCoach, type CoachCamino } from "@/components/coach/el-camino-coach";

export const metadata = { title: "Camino | Coach" };

export default async function CoachCaminoPage() {
  await requireSection("ENTRENADOR");

  const clasesRaw = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      emoji: true,
      color: true,
      description: true,
      temas: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          name: true,
          emoji: true,
          color: true,
          posX: true,
          posY: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              emoji: true,
              color: true,
              posX: true,
              posY: true,
            },
          },
        },
      },
    },
  });

  const layouts = await getEtapaLayouts(clasesRaw.map((c) => c.id));

  const caminos: CoachCamino[] = clasesRaw.map((clase) => {
    const layout = layouts.get(clase.id);
    return {
      id: clase.id,
      name: clase.name,
      emoji: clase.emoji,
      color: clase.color,
      description: clase.description,
      etapas: clase.temas.map((tema) => {
        const mPos = layout?.temas.get(tema.id) ?? { posX: tema.posX, posY: tema.posY };
        return {
          id: tema.id,
          order: tema.order,
          name: tema.name,
          emoji: tema.emoji,
          color: tema.color,
          posX: mPos.posX,
          posY: mPos.posY,
          lecciones: tema.lessons.map((l) => {
            const lPos = layout?.lessons.get(l.id) ?? { posX: l.posX, posY: l.posY };
            return { ...l, posX: lPos.posX, posY: lPos.posY };
          }),
        };
      }),
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-emerald-950 dark:text-white">El Camino</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Revisa cómo se ve el recorrido de tus jugadores en cada etapa. Se actualiza en tiempo real.
        </p>
      </div>
      <ElCaminoCoach caminos={caminos} />
    </div>
  );
}