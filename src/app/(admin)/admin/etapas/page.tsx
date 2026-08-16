import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { BookIcon, GamepadIcon, MapIcon } from "@/components/icons";
import {
  NewEtapaModal,
  DeleteEtapaButton,
} from "@/components/admin/etapa-materia-form";

export const metadata = { title: "Etapas | Admin" };

export default async function AdminEtapasPage() {
  await requireAdmin();

  const etapas = await prisma.etapa.findMany({
    orderBy: { order: "asc" },
    include: {
      materias: {
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
            Etapas
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Cada etapa agrupa sus asignaturas ilimitadas. Configura cuáles va a tener cada una desde Caminos.
          </p>
        </div>
        <NewEtapaModal />
      </div>

      <div className="space-y-5">
          {etapas.length === 0 && (
            <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
              Aún no hay etapas. Crea la primera desde el formulario.
            </div>
          )}

          {etapas.map((etapa) => (
            <div
              key={etapa.id}
              className="overflow-hidden rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
            >
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ backgroundColor: `${etapa.color}14` }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl">
                  {etapa.emoji}
                </span>
                <div className="flex-1">
                  <h3 className="font-black text-emerald-950 dark:text-white">{etapa.name}</h3>
                  {etapa.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{etapa.description}</p>
                  )}
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {etapa.materias.length} asignaturas
                  </p>
                </div>
                <Link
                  href={`/admin/caminos/${etapa.id}`}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-green-200 px-3 py-2 text-xs font-black text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400"
                >
                  <MapIcon className="h-3.5 w-3.5" />
                  Configurar camino
                </Link>
                <Link
                  href="/admin/lessons"
                  className="rounded-xl border-2 border-green-200 px-3 py-2 text-xs font-black text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400"
                >
                  Ver lecciones
                </Link>
                <DeleteEtapaButton id={etapa.id} hasMaterias={etapa.materias.length > 0} />
              </div>

              <div className="space-y-2 p-4">
                {etapa.materias.length === 0 && (
                  <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-center text-xs font-bold text-zinc-400 dark:bg-emerald-900">
                    Esta etapa aún no tiene asignaturas. Configúralas desde Caminos.
                  </p>
                )}
                {etapa.materias.map((materia) => (
                  <div
                    key={materia.id}
                    className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-emerald-900"
                  >
                    <span className="text-lg">{materia.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-emerald-950 dark:text-white">
                        {materia.name}
                      </p>
                      <p className="text-[11px] font-bold text-zinc-400">
                        {materia._count.lessons} lecciones · {materia.xpReward} XP
                      </p>
                    </div>
                    <Link
                      href={`/admin/lessons?materia=${materia.id}`}
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
