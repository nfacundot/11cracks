import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BookIcon, GamepadIcon, MapIcon } from "@/components/icons";
import {
  NewClaseModal,
  DeleteClaseButton,
} from "@/components/admin/etapa-materia-form";

export async function EtapasView({ basePath }: { basePath: string }) {
  const clases = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    include: {
      temas: {
        orderBy: { order: "asc" },
        include: { _count: { select: { lessons: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-emerald-950 dark:text-white">
            <BookIcon className="h-6 w-6 text-green-500" />
            Clases
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cada clase agrupa sus temas ilimitados. Configura cuáles va a tener cada una desde Caminos.
          </p>
        </div>
        <NewClaseModal />
      </div>

      <div className="space-y-5">
        {clases.length === 0 && (
          <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
            Aún no hay clases. Crea la primera desde el formulario.
          </div>
        )}

        {clases.map((clase) => (
          <div
            key={clase.id}
            className="overflow-hidden rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
          >
            <div
              className="flex items-center gap-3 px-5 py-4"
              style={{ backgroundColor: `${clase.color}14` }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl">
                {clase.emoji}
              </span>
              <div className="flex-1">
                <h3 className="font-black text-emerald-950 dark:text-white">{clase.name}</h3>
                {clase.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{clase.description}</p>
                )}
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  {clase.temas.length} temas
                </p>
              </div>
              <Link
                href={`${basePath}/caminos/${clase.id}`}
                className="flex items-center gap-1.5 rounded-xl border-2 border-green-200 px-3 py-2 text-xs font-black text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400"
              >
                <MapIcon className="h-3.5 w-3.5" />
                Configurar camino
              </Link>
              <Link
                href={`${basePath}/lessons`}
                className="rounded-xl border-2 border-green-200 px-3 py-2 text-xs font-black text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400"
              >
                Ver lecciones
              </Link>
              <DeleteClaseButton id={clase.id} hasTemas={clase.temas.length > 0} />
            </div>

            <div className="space-y-2 p-4">
              {clase.temas.length === 0 && (
                <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-center text-xs font-bold text-zinc-400 dark:bg-emerald-900">
                  Esta clase aún no tiene temas. Configúralos desde Caminos.
                </p>
              )}
              {clase.temas.map((tema) => (
                <div
                  key={tema.id}
                  className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-emerald-900"
                >
                  <span className="text-lg">{tema.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-emerald-950 dark:text-white">
                      {tema.name}
                    </p>
                    <p className="text-[11px] font-bold text-zinc-400">
                      {tema._count.lessons} lecciones · {tema.xpReward} XP
                    </p>
                  </div>
                  <Link
                    href={`${basePath}/lessons?materia=${tema.id}`}
                    className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-green-600 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-emerald-950"
                  >
                    <GamepadIcon className="h-3.5 w-3.5" />
                    Contenido
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
