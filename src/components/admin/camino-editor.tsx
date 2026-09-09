"use client";

import { useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { saveLeccionPosition, saveTemaPosition } from "@/actions/admin";
import { CheckIcon } from "@/components/icons";

export type CaminoLeccion = {
  id: string;
  title: string;
  emoji: string;
  color: string;
  posX: number;
  posY: number;
};

export type CaminoTema = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  posX: number;
  posY: number;
  lecciones: CaminoLeccion[];
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const GRID = 2;
const snap = (v: number) => Math.round(v / GRID) * GRID;

type DragItem = {
  kind: "tema" | "leccion";
  temaId: string;
  leccionId?: string;
  offsetX: number;
  offsetY: number;
};

export function CaminoEditor({
  claseId,
  claseName,
  temas,
}: {
  claseId: string;
  claseName: string;
  temas: CaminoTema[];
}) {
  const [items, setItems] = useState(temas);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragItem | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const totalLecciones = items.reduce((sum, tema) => sum + tema.lecciones.length, 0);
  const canvasHeight = clamp(Math.max(780, (items.length + totalLecciones) * 190), 780, 1500);

  const positionFromEvent = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const setItemPosition = (temaId: string, leccionId: string | undefined, posX: number, posY: number) => {
    setItems((prev) =>
      prev.map((tema) => {
        if (!leccionId) {
          return tema.id === temaId ? { ...tema, posX, posY } : tema;
        }
        if (tema.id !== temaId) return tema;
        return {
          ...tema,
          lecciones: tema.lecciones.map((leccion) =>
            leccion.id === leccionId ? { ...leccion, posX, posY } : leccion
          ),
        };
      })
    );
  };

  const onPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    kind: "tema" | "leccion",
    temaId: string,
    leccionId?: string
  ) => {
    if (pending) return;
    const tema = items.find((it) => it.id === temaId);
    if (!tema) return;
    const item =
      kind === "tema"
        ? { posX: tema.posX, posY: tema.posY }
        : tema.lecciones.find((leccion) => leccion.id === leccionId) ?? null;
    if (!item) return;
    const pos = positionFromEvent(e.clientX, e.clientY);
    dragRef.current = {
      kind,
      temaId,
      leccionId,
      offsetX: pos.x - item.posX,
      offsetY: pos.y - item.posY,
    };
    setDraggingKey(kind === "tema" ? temaId : leccionId ?? "");
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = positionFromEvent(e.clientX, e.clientY);
    const x = clamp(snap(pos.x - drag.offsetX), 5, 95);
    const y = clamp(snap(pos.y - drag.offsetY), 5, 95);
    setItemPosition(drag.temaId, drag.leccionId, x, y);
    void rect;
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDraggingKey(null);
    const item =
      drag.kind === "tema"
        ? items.find((it) => it.id === drag.temaId)
        : items.find((it) => it.id === drag.temaId)?.lecciones.find((leccion) => leccion.id === drag.leccionId);
    if (!item) return;
    startTransition(() => {
      const save =
        drag.kind === "tema"
          ? saveTemaPosition(drag.temaId, item.posX, item.posY, claseId)
          : saveLeccionPosition(drag.leccionId!, item.posX, item.posY, claseId);
      void save.then((res) => {
        if (res?.success) {
          const key = drag.kind === "tema" ? drag.temaId : drag.leccionId!;
          setSavedKey(key);
          setTimeout(() => setSavedKey((cur) => (cur === key ? null : cur)), 1400);
        }
        router.refresh();
      });
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
        Arrastra las materias y sus lecciones sobre el fondo para colocarlas en el camino. Se guarda al soltar.
      </p>
      <div
        ref={containerRef}
        className="el-camino--map el-camino__map-canvas relative mx-auto w-full select-none overflow-hidden"
        style={{ height: canvasHeight }}
      >
        <Image
          src="/img/back/backa.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 78rem) 100vw, 78rem"
          className="el-camino__map-canvas-bg"
          draggable={false}
        />
        {items.map((tema, i) => {
          const isDragging = draggingKey === tema.id;
          const isSaved = savedKey === tema.id;
          return (
            <div
              key={tema.id}
              className="el-camino__map-stage"
              style={{ left: `${tema.posX}%`, top: `${tema.posY}%`, zIndex: isDragging ? 30 : undefined }}
            >
              <button
                type="button"
                onPointerDown={(e) => onPointerDown(e, "tema", tema.id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                title={`${tema.name} · ${Math.round(tema.posX)}%, ${Math.round(tema.posY)}%`}
                className={`el-camino__landmark el-camino__landmark--emoji relative touch-none active:cursor-grabbing ${
                  isDragging ? "scale-110" : "hover:scale-105"
                }`}
                style={{ "--stage-accent": tema.color } as CSSProperties}
              >
                <span className="el-camino__landmark-icon">{tema.emoji}</span>
                <span className="el-camino__landmark-copy">
                  <small>MATERIA {i + 1}</small>
                  <strong>{tema.name}</strong>
                  <span>{tema.lecciones.length} lecciones</span>
                </span>
                {isSaved && (
                  <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 z-10 flex h-5 w-5 animate-pop items-center justify-center rounded-full bg-green-500 text-white shadow">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                )}
              </button>
            </div>
          );
        })}
        {items.flatMap((tema) =>
          tema.lecciones.map((leccion, idx) => {
            const isDragging = draggingKey === leccion.id;
            const isSaved = savedKey === leccion.id;
            return (
              <div
                key={leccion.id}
                className="el-camino__map-lesson"
                style={{ left: `${leccion.posX}%`, top: `${leccion.posY}%`, zIndex: isDragging ? 30 : undefined }}
              >
                <button
                  type="button"
                  onPointerDown={(e) => onPointerDown(e, "leccion", tema.id, leccion.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  title={`${tema.name} · ${leccion.title} · ${Math.round(leccion.posX)}%, ${Math.round(leccion.posY)}%`}
                  className={`el-camino__node touch-none active:cursor-grabbing ${
                    isDragging ? "scale-110" : "hover:scale-105"
                  }`}
                >
                  <span className="el-camino__node-orb">
                    <b>{leccion.emoji}</b>
                    <i>{idx + 1}</i>
                  </span>
                  <span className="el-camino__node-copy">
                    <strong>{leccion.title}</strong>
                    <small>{tema.name}</small>
                  </span>
                  {isSaved && (
                    <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 flex h-4 w-4 animate-pop items-center justify-center rounded-full bg-green-500 text-white shadow">
                      <CheckIcon className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
      <p className="text-[11px] font-bold text-zinc-400">
        {claseName} · {items.length} materias · {totalLecciones} lecciones · arrastra para posicionar
      </p>
    </div>
  );
}