"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

export type CoachCaminoEtapa = {
  id: string;
  order: number;
  name: string;
  emoji: string;
  color: string;
  posX: number;
  posY: number;
  lecciones: {
    id: string;
    title: string;
    emoji: string;
    color: string;
    posX: number;
    posY: number;
  }[];
};

export type CoachCamino = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  etapas: CoachCaminoEtapa[];
};

function useFreePositions(camino: CoachCamino | null): boolean {
  if (!camino) return false;
  const editable = camino.etapas.filter((etapa) => etapa.posX !== undefined && etapa.posY !== undefined);
  const editableLessons = camino.etapas.some((etapa) => etapa.lecciones.some((l) => l.posX !== undefined && l.posY !== undefined));
  if (editable.length === 0 && !editableLessons) return false;
  const stagesOff = editable.some((etapa) => Math.abs(etapa.posX - 50) > 2 || Math.abs(etapa.posY - 50) > 2);
  const lessonsOff = camino.etapas.some((etapa) =>
    etapa.lecciones.some((l) => l.posX !== undefined && l.posY !== undefined && (Math.abs(l.posX - 50) > 2 || Math.abs(l.posY - 50) > 2))
  );
  return stagesOff || lessonsOff;
}

function lessonPosition(etapa: CoachCaminoEtapa, index: number): { posX: number; posY: number } {
  const lesson = etapa.lecciones[index];
  if (lesson.posX !== undefined && lesson.posY !== undefined) return { posX: lesson.posX, posY: lesson.posY };
  const base = { posX: etapa.posX, posY: etapa.posY };
  const offsets = [
    { posX: -11, posY: -7 },
    { posX: 11, posY: -7 },
    { posX: 0, posY: 9 },
  ];
  const offset = offsets[index % offsets.length];
  return { posX: base.posX + offset.posX, posY: base.posY + offset.posY };
}

export function ElCaminoCoach({ caminos }: { caminos: CoachCamino[] }) {
  const [activeId, setActiveId] = useState<string>(caminos[0]?.id ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      if (alive) router.refresh();
    };
    const focusHandler = () => refresh();
    window.addEventListener("focus", focusHandler);
    const interval = window.setInterval(refresh, 8000);
    return () => {
      alive = false;
      window.removeEventListener("focus", focusHandler);
      window.clearInterval(interval);
    };
  }, [router]);

  const camino = caminos.find((c) => c.id === activeId) ?? caminos[0] ?? null;
  const freeForm = useFreePositions(camino);
  if (!camino) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
        Todavía no hay caminos configurados.
      </div>
    );
  }

  const canvasHeight = Math.max(560, camino.etapas.length * 170 + camino.etapas.reduce((sum, e) => sum + e.lecciones.length, 0) * 40);
  const totalLecciones = camino.etapas.reduce((sum, e) => sum + e.lecciones.length, 0);

  return (
    <div className="space-y-3">
      <div className="relative">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-xl border border-green-100 bg-white px-3 py-2 text-left shadow-sm dark:border-emerald-800/70 dark:bg-emerald-950/40"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="text-xl" aria-hidden="true">{camino.emoji}</span>
          <span className="min-w-0 flex-1">
            <small className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Etapa {camino.etapas.map((e) => e.order + 1).join(", ") || "—"}
            </small>
            <strong className="block truncate text-sm font-black text-emerald-950 dark:text-white">{camino.name}</strong>
          </span>
          <span className="text-[10px] font-bold text-zinc-400">{totalLecciones} lecciones</span>
          <span aria-hidden="true">{menuOpen ? "▲" : "▼"}</span>
        </button>
        {menuOpen ? (
          <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-green-100 bg-white shadow-xl dark:border-emerald-800/70 dark:bg-emerald-950">
            {caminos.map((c) => (
              <button
                key={c.id}
                type="button"
                role="menuitemradio"
                aria-checked={c.id === camino.id}
                data-selected={c.id === camino.id}
                onClick={() => {
                  setActiveId(c.id);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-zinc-50 data-[selected=true]:bg-green-50 dark:hover:bg-emerald-900/40 dark:data-[selected=true]:bg-emerald-900/40"
              >
                <span className="text-lg" aria-hidden="true">{c.emoji}</span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-black text-emerald-950 dark:text-white">{c.name}</strong>
                  <small className="block text-[10px] font-bold text-zinc-400">{c.etapas.length} materias</small>
                </span>
                {c.id === camino.id ? <span className="text-green-600">✓</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="el-camino__coach-note">
        Vista en tiempo real del camino que ven los jugadores. Los cambios del admin se reflejan aquí
        automáticamente.
      </div>

      {!freeForm ? (
        <div className="space-y-6">
          {camino.etapas.map((etapa) => (
            <section key={etapa.id} className="el-camino__stage" data-stage={etapa.id} aria-labelledby={`coach-camino-etapa-${etapa.id}`}>
              <header>
                <span className="el-camino__stage-badge">MATERIA {etapa.order + 1}</span>
                <h3 id={`coach-camino-etapa-${etapa.id}`} className="text-lg font-black text-emerald-950 dark:text-white">
                  {etapa.emoji} {etapa.name}
                </h3>
              </header>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {etapa.lecciones.map((lesson) => (
                  <div key={lesson.id} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm shadow" style={{ backgroundColor: lesson.color }}>
                      {lesson.emoji}
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-xs font-black text-emerald-950 dark:text-white">{lesson.title}</strong>
                      <small className="block text-[10px] font-bold text-zinc-400">{Math.round(lesson.posX)}%, {Math.round(lesson.posY)}%</small>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="el-camino el-camino--map">
          <div className="el-camino__map-canvas" style={{ height: canvasHeight }} data-testid="el-camino-coach-canvas">
            <Image
              src="/img/back/backa.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 56rem) 100vw, 56rem"
              className="el-camino__map-canvas-bg"
              draggable={false}
            />
            {camino.etapas.map((etapa) => (
              <div
                key={etapa.id}
                className="el-camino__map-stage"
                style={{ left: `${etapa.posX}%`, top: `${etapa.posY}%` }}
              >
                <div className="el-camino__landmark el-camino__landmark--emoji el-camino__landmark--readonly" style={{ "--stage-accent": etapa.color } as CSSProperties}>
                  <span className="el-camino__landmark-icon">{etapa.emoji}</span>
                  <span className="el-camino__landmark-copy"><small>MATERIA {etapa.order + 1}</small><strong>{etapa.name}</strong><span>{etapa.lecciones.length} lecciones</span></span>
                </div>
              </div>
            ))}
            {camino.etapas.flatMap((etapa) =>
              etapa.lecciones.map((lesson, index) => {
                const pos = lessonPosition(etapa, index);
                return (
                  <div
                    key={lesson.id}
                    className="el-camino__map-lesson"
                    data-stage={etapa.id}
                    style={{ left: `${pos.posX}%`, top: `${pos.posY}%` }}
                    title={`${etapa.name} · ${lesson.title}`}
                  >
                    <span className="el-camino__node el-camino__node--readonly">
                      <span className="el-camino__node-orb"><b>{lesson.emoji}</b><i>{index + 1}</i></span>
                      <span className="el-camino__node-copy"><strong>{lesson.title}</strong><small>{etapa.name}</small></span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-zinc-400">
        {camino.etapas.map((etapa) => (
          <span key={etapa.id} className="rounded-full border border-zinc-200 px-2 py-0.5 dark:border-zinc-700">
            {etapa.emoji} {etapa.name}: {etapa.posX.toFixed(0)}%, {etapa.posY.toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}