import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { MapIcon, ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Caminos | Admin" };

export default async function AdminCaminosPage() {
  await requireAdmin();

  const clases = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { temas: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-black text-emerald-950 dark:text-white">
          <MapIcon className="h-6 w-6 text-sky-500" />
          Caminos
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Los caminos solo configuran los temas que tiene cada clase, sin límite. Asigna aquí los temas de cada clase.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {clases.length === 0 && (
          <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
            Aún no hay clases. Crea una clase para empezar su camino.
          </div>
        )}

        {clases.map((clase) => (
          <Link
            key={clase.id}
            href={`/admin/caminos/${clase.id}`}
            className="group flex items-center gap-4 rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 transition hover:shadow-md dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: `${clase.color}22` }}
            >
              {clase.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-emerald-950 dark:text-white">{clase.name}</h3>
              <p className="text-xs font-bold text-zinc-400">
                {clase._count.temas} temas configurados
              </p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-1 dark:text-zinc-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}
