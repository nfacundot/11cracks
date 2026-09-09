import Link from "next/link";
import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEtapaLayouts } from "@/lib/el-camino/layout";
import { ArrowLeftIcon } from "@/components/icons";
import { CaminoSettingsView, type CaminoSettingsClase } from "@/components/admin/sections/camino-settings-view";

export const metadata = { title: "Configuración de camino | Admin" };

export default async function SettingsCaminoPage() {
  await requireSection("ADMIN");

  const clasesRaw = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      emoji: true,
      color: true,
      temas: {
        orderBy: { order: "asc" },
        select: {
          id: true,
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

  const data: CaminoSettingsClase[] = clasesRaw.map((clase) => {
    const layout = layouts.get(clase.id);
    return {
      id: clase.id,
      name: clase.name,
      emoji: clase.emoji,
      color: clase.color,
      temas: clase.temas.map((tema) => {
        const mPos = layout?.temas.get(tema.id) ?? { posX: tema.posX, posY: tema.posY };
        return {
          id: tema.id,
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
    <div className="mx-auto max-w-6xl space-y-5">
      <Link
        href="/admin/settings"
        className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 transition hover:text-green-600 dark:text-zinc-400"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a Configuración
      </Link>
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">
          Configuración de Camino
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Selecciona una clase y arrastra sus materias y lecciones sobre la cancha para definir la ruta
          que se muestra en el jugador y el entrenador, con actualización en tiempo real.
        </p>
      </div>
      <CaminoSettingsView clases={data} />
    </div>
  );
}