"use client";

import { useState } from "react";
import Link from "next/link";
import { CaminoEditor, type CaminoTema } from "@/components/admin/camino-editor";

export type CaminoSettingsClase = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  temas: CaminoTema[];
};

export function CaminoSettingsView({ clases }: { clases: CaminoSettingsClase[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(clases[0]?.id ?? null);
  const selected = clases.find((clase) => clase.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      {clases.length === 0 && (
        <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
          Aún no hay clases. Crea una clase para empezar su camino.
        </div>
      )}

      {clases.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Clases del camino">
            {clases.map((clase) => {
              const isSelected = clase.id === selectedId;
              return (
                <button
                  key={clase.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  onClick={() => setSelectedId(clase.id)}
                  className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-black transition ${
                    isSelected
                      ? "text-emerald-950 ring-2 ring-green-400 dark:text-white dark:ring-emerald-500"
                      : "text-zinc-500 hover:text-emerald-950 dark:hover:text-white"
                  }`}
                  style={{ backgroundColor: `${clase.color}22` }}
                >
                  <span className="text-lg">{clase.emoji}</span>
                  <span>{clase.name}</span>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {clase.temas.length} materias
                  </span>
                </button>
              );
            })}
          </div>

          {selected && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-emerald-950 dark:text-white">
                    {selected.emoji} {selected.name}
                  </h3>
                  <p className="text-xs font-bold text-zinc-400">
                    Arrastra las materias y sus lecciones sobre la cancha para definir la ruta. Se guarda al soltar.
                  </p>
                </div>
                <Link
                  href={`/admin/caminos/${selected.id}`}
                  className="flex items-center gap-1.5 rounded-xl border border-green-100 px-3 py-2 text-xs font-bold text-green-600 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400 dark:hover:bg-emerald-950"
                >
                  Ver temas y lecciones
                </Link>
              </div>
              <CaminoEditor
          key={selected.id}
          claseId={selected.id}
          claseName={selected.name}
          temas={selected.temas}
        />
            </>
          )}
        </>
      )}
    </div>
  );
}