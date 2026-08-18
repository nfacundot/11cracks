import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { BookIcon, GamepadIcon } from "@/components/icons";
import { NewTemaModal, EditTemaModal, DeleteTemaButton, AssignTemaSelect, UnassignTemaButton } from "@/components/admin/etapa-materia-form";

export const metadata = { title: "Temas | Admin" };

export default async function AdminTemasPage() {
  await requireAdmin();

  const [clases, temas] = await Promise.all([
    prisma.clase.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, emoji: true },
    }),
    prisma.tema.findMany({
      orderBy: [{ claseId: "asc" }, { order: "asc" }],
      include: {
        clase: { select: { id: true, name: true, emoji: true, color: true } },
        _count: { select: { lessons: true } },
      },
    }),
  ]);

  const claseOptions = clases.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji }));
  const unassignedTemas = temas.filter((s) => !s.claseId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-emerald-950 dark:text-white">
            <BookIcon className="h-6 w-6 text-purple-500" />
            Temas
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Todas los temas creados en el proyecto, sin importar su clase. Aquí los editas y asocias.
          </p>
        </div>
        <NewTemaModal clases={claseOptions} />
      </div>

      <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {clases.map((s) => (
              <span
                key={s.id}
                className="rounded-full bg-white/60 backdrop-blur-xl px-3 py-1.5 text-xs font-black text-zinc-600 ring-1 ring-green-100 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-zinc-300 dark:ring-emerald-900"
              >
                {s.emoji} {s.name}
              </span>
            ))}
          </div>

          {temas.length === 0 && (
            <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
              Aún no hay temas. Crea la primera desde el formulario.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {temas.map((tema) => {
              const isUnassigned = !tema.claseId;
              return (
                <div
                  key={tema.id}
                  className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ backgroundColor: `${tema.color}22` }}
                    >
                      {tema.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-emerald-950 dark:text-white">{tema.name}</p>
                      <p className="text-[11px] font-bold text-zinc-400">
                        {tema._count.lessons} lecciones · {tema.xpReward} XP
                        {isUnassigned ? (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            Sin clase
                          </span>
                        ) : (
                          <span className="ml-2" style={{ color: tema.clase?.color }}>
                            {tema.clase?.emoji} {tema.clase?.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/admin/lessons?materia=${tema.id}`}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-green-600 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-emerald-900"
                    >
                      <GamepadIcon className="h-3.5 w-3.5" />
                      Contenido
                    </Link>
                    <EditTemaModal tema={tema} clases={claseOptions} />
                    {!isUnassigned && <UnassignTemaButton id={tema.id} />}
                    <DeleteTemaButton id={tema.id} />
                  </div>
                  {!isUnassigned && (
                    <AssignTemaSelect
                      claseId={tema.claseId!}
                      unassigned={unassignedTemas}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
}
