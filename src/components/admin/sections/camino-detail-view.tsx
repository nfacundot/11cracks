import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeftIcon, GamepadIcon } from "@/components/icons";
import { CaminoEditor } from "@/components/admin/camino-editor";
import {
  AssignTemaSelect,
  UnassignTemaButton,
  DeleteTemaButton,
} from "@/components/admin/etapa-materia-form";

export async function CaminoDetailView({
  basePath,
  etapaId,
}: {
  basePath: string;
  etapaId: string;
}) {
  const clase = await prisma.clase.findUnique({
    where: { id: etapaId },
    include: {
      temas: {
        orderBy: { order: "asc" },
        include: { _count: { select: { lessons: true } } },
      },
    },
  });

  if (!clase) notFound();

  const unassignedTemas = await prisma.tema.findMany({
    where: { claseId: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true, emoji: true, color: true, xpReward: true, _count: { select: { lessons: true } } },
  });

  const editorTemas = clase.temas.map((m) => ({
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
          href={`${basePath}/caminos`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-100 text-zinc-500 transition hover:bg-green-50 dark:border-emerald-800 dark:text-zinc-400 dark:hover:bg-emerald-950"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-emerald-950 dark:text-white">
            {clase.emoji} {clase.name}
          </h2>
          <p className="text-xs font-bold text-zinc-400">
            Camino de la clase. Posiciona los temas con arrastre, sin límite.
          </p>
        </div>
      </div>

      <CaminoEditor
        key={editorTemas.map((m) => m.id).join("-")}
        claseName={clase.name}
        temas={editorTemas}
      />

      <div className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
        <h3 className="mb-3 font-black text-emerald-950 dark:text-white">
          Temas de la clase ({clase.temas.length})
        </h3>
        <div className="space-y-2">
          {clase.temas.length === 0 && (
            <p className="rounded-xl bg-zinc-50 px-3 py-2.5 text-center text-xs font-bold text-zinc-400 dark:bg-emerald-900">
              Esta clase no tiene temas todavía. Asocia los primeros abajo.
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
                  {tema._count.lessons} lecciones · {tema.xpReward} XP ·{" "}
                  {Math.round(tema.posX)}%, {Math.round(tema.posY)}%
                </p>
              </div>
              <Link
                href={`${basePath}/lessons?materia=${tema.id}`}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-green-600 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-emerald-950"
              >
                <GamepadIcon className="h-3.5 w-3.5" />
                Contenido
              </Link>
              <UnassignTemaButton id={tema.id} />
              <DeleteTemaButton id={tema.id} />
            </div>
          ))}
        </div>
        <AssignTemaSelect claseId={clase.id} unassigned={unassignedTemas} />
      </div>
    </div>
  );
}
