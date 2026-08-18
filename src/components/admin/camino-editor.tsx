"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { saveTemaPosition } from "@/actions/admin";
import { CheckIcon } from "@/components/icons";

export type CaminoTema = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  posX: number;
  posY: number;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export function CaminoEditor({
  claseName,
  temas,
}: {
  claseName: string;
  temas: CaminoTema[];
}) {
  const [items, setItems] = useState(temas);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    posX: number;
    posY: number;
  } | null>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const canvasHeight = Math.max(600, items.length * 170);

  const positionFromEvent = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>, id: string) => {
    if (pending) return;
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const pos = positionFromEvent(e.clientX, e.clientY);
    dragRef.current = {
      id,
      offsetX: pos.x - item.posX,
      offsetY: pos.y - item.posY,
      posX: item.posX,
      posY: item.posY,
    };
    setDraggingId(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const pos = positionFromEvent(e.clientX, e.clientY);
    const x = clamp(pos.x - drag.offsetX, 5, 95);
    const y = clamp(pos.y - drag.offsetY, 5, 95);
    drag.posX = x;
    drag.posY = y;
    setItems((prev) =>
      prev.map((it) => (it.id === drag.id ? { ...it, posX: x, posY: y } : it))
    );
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDraggingId(null);
    startTransition(() => {
      void saveTemaPosition(drag.id, drag.posX, drag.posY).then((res) => {
        if (res?.success) {
          setSavedId(drag.id);
          setTimeout(() => setSavedId((cur) => (cur === drag.id ? null : cur)), 1400);
        }
        router.refresh();
      });
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
        Arrastra los círculos sobre el fondo para colocarlos en el camino. Se guarda al soltar.
      </p>
      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-md select-none overflow-hidden rounded-2xl border border-green-100 shadow-inner dark:border-emerald-800"
        style={{ height: canvasHeight }}
      >
        <Image
          src="/img/back/backa.png"
          alt=""
          fill
          priority
          sizes="(max-width: 448px) 448px, 448px"
          className="object-cover"
          draggable={false}
        />
        {items.map((item, i) => {
          const isDragging = draggingId === item.id;
          const isSaved = savedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onPointerDown={(e) => onPointerDown(e, item.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              title={`${item.name} · ${Math.round(item.posX)}%, ${Math.round(item.posY)}%`}
              className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full text-2xl shadow-lg ring-4 ring-white transition-[scale,box-shadow] active:cursor-grabbing dark:ring-emerald-950 ${
                isDragging ? "z-20 scale-125 shadow-2xl" : "z-10 hover:scale-110"
              }`}
              style={{ left: `${item.posX}%`, top: `${item.posY}%`, backgroundColor: item.color }}
            >
              <span className="pointer-events-none">{item.emoji}</span>
              <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/60 backdrop-blur-xl text-[10px] font-black text-emerald-950 shadow dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:text-white">
                {i + 1}
              </span>
              {isSaved && (
                <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 flex h-5 w-5 animate-pop items-center justify-center rounded-full bg-green-500 text-white shadow">
                  <CheckIcon className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] font-bold text-zinc-400">
        {claseName} · {items.length} temas · arrastra para posicionar
      </p>
    </div>
  );
}
