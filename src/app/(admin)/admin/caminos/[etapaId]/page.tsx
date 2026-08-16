import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ArrowLeftIcon, GamepadIcon } from "@/components/icons";
import { CaminoEditor } from "@/components/admin/camino-editor";
import {
  AssignMateriaSelect,
  UnassignMateriaButton,
  DeleteMateriaButton,
} from "@/components/admin/etapa-materia-form";

export const metadata = { title: "Configurar Camino | Admin" };

export default async function AdminCaminoConfigPage({
  params,
}: {
  params: Promise<{ etapaId: string }>;
}) {
  await requireAdmin();
  const { etapaId } = await params;

  const etapa = await prisma.etapa.findUnique({
    where: { id: etapaId },
    include: {
      materias: {
        orderBy: { order: "asc" },
        include: { _count: { select: { lessons: true } } },
      },
    },
  });

  if (!etapa) notFound();

  const unassignedMaterias = await prisma.materia.findMany({
    where: { etapaId: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true, emoji: true, color: true, xpReward: true, _count: { select: { lessons: true } } },
  });

  const editorMaterias = etapa.materias.map((m) => ({
    id: m.id,
    name: m.name,
    emoji: m.emoji,
    color: m.color,
    posX: m.posX,
    posY: m.posY,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/caminos"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-100 text-zinc-500 transition hover:bg-green-50 dark:border-emerald-800 dark:text-zinc-400 dark:hover:bg-emerald-950"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-emerald-950 dark:text-white">
            {etapa.emoji} {etapa.name}
          </h2>
          <p className="text-xs font-bold text-zinc-400">
            Camino de la etapa. Posiciona las asignaturas con arrastre, sin límite.
          </p>
        </div>
      </div>

      <CaminoEditor
        key={editorMaterias.map((m) => m.id).join("-")}
        etapaName={etapa.name}
        materias={editorMaterias}
      />

      <div className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
        <h3 className="mb-3 font-black text-emerald-950 dark:text-white">
          Asignaturas de la etapa ({etapa.materias.length})
        </h3>
        <div className="space-y-2">
          {etapa.materias.length === 0 && (
            <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-center text-xs font-bold text-zinc-400 dark:bg-emerald-900">
              Esta etapa no tiene asignaturas todavía. Asocia las primeras abajo.
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
                  {materia._count.lessons} lecciones · {materia.xpReward} XP ·{" "}
                  {Math.round(materia.posX)}%, {Math.round(materia.posY)}%
                </p>
              </div>
              <Link
                href={`/admin/lessons?materia=${materia.id}`}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-green-600 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-emerald-950"
              >
                <GamepadIcon className="h-3.5 w-3.5" />
                Contenido
              </Link>
              <UnassignMateriaButton id={materia.id} />
              <DeleteMateriaButton id={materia.id} />
            </div>
          ))}
        </div>
        <AssignMateriaSelect etapaId={etapa.id} unassigned={unassignedMaterias} />
      </div>
    </div>
  );
}
