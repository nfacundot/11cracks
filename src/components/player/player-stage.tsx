"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PlayerWorld, type WorldIdentity } from "./player-world";
import { PlayerRoom } from "./player-room";
import type { AvatarConfig } from "@/lib/avatar";
import type { RoomData } from "@/lib/room";
import { consumeSleepRequest, energySnapshot, requestSleep, setEnergy, subscribeEnergy } from "@/lib/energy";
import { NEED_KEYS, getNeed, setNeed } from "@/lib/needs";

/**
 * Alterna la escena 3D: ciudad (mundo) o interior de la habitación.
 * Los cambios se disparan con los eventos "goal50:enter-room" / "goal50:exit-room".
 * En cada cambio de escena se muestra una pantalla de "Cargando…".
 */
export function PlayerStage({ config, self }: { config: AvatarConfig | null; self: WorldIdentity | null }) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inRoomRef = useRef(false);
  const handlingRef = useRef(false);

  // Mantiene la identidad del avatar estable entre refrescos del servidor para
  // no reconstruir la escena 3D al avanzar en una lección.
  const configKey = JSON.stringify(config ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableConfig = useMemo(() => config, [configKey]);

  const selfKey = JSON.stringify(self ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableSelf = useMemo(() => self, [selfKey]);

  useEffect(() => {
    inRoomRef.current = room !== null;
  }, [room]);

  useEffect(() => {
    const onEnter = (event: Event) => {
      const detail = (event as CustomEvent<RoomData>).detail;
      if (!detail) return;
      setRoom(detail);
      setLoading(true);
      setProgress(0);
    };
    const onExit = () => {
      setRoom(null);
      setLoading(true);
      setProgress(0);
    };
    window.addEventListener("goal50:enter-room", onEnter);
    window.addEventListener("goal50:exit-room", onExit);
    return () => {
      window.removeEventListener("goal50:enter-room", onEnter);
      window.removeEventListener("goal50:exit-room", onExit);
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    const start = Date.now();
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const id = setInterval(() => {
      setProgress(Math.min(96, ((Date.now() - start) / 1100) * 100));
    }, 60);
    const done = setTimeout(() => {
      setProgress(100);
      hideTimer = setTimeout(() => setLoading(false), 180);
    }, 1200);
    return () => {
      clearInterval(id);
      clearTimeout(done);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [loading]);

  // Consumo de energía y necesidades (1 por cada 10 minutos)
  useEffect(() => {
    const id = setInterval(() => {
      if (!inRoomRef.current) {
        const current = energySnapshot();
        if (current > 0) setEnergy(current - 1);
      }
      for (const key of NEED_KEYS) {
        const value = getNeed(key);
        if (value > 0) setNeed(key, value - 1);
      }
    }, 600000);
    return () => clearInterval(id);
  }, []);

  // Energía a 0 → volver a la habitación y dormir
  useEffect(() => {
    const unsub = subscribeEnergy(() => {
      if (energySnapshot() > 0 || handlingRef.current) return;
      handlingRef.current = true;
      void (async () => {
        try {
          const res = await fetch("/api/room", { cache: "no-store" });
          const data = res.ok ? ((await res.json()) as { room: RoomData | null }) : null;
          if (data?.room) {
            requestSleep();
            setRoom(data.room);
            setLoading(true);
            setProgress(0);
            window.dispatchEvent(new CustomEvent("goal50:sleep"));
          } else {
            setEnergy(60);
          }
        } finally {
          handlingRef.current = false;
        }
      })();
    });
    return unsub;
  }, []);

  // Si quedó una petición de dormir pendiente al montar la habitación
  useEffect(() => {
    if (!room) return;
    if (!consumeSleepRequest()) return;
    const id = setTimeout(() => window.dispatchEvent(new CustomEvent("goal50:sleep")), 700);
    return () => clearTimeout(id);
  }, [room]);

  return (
    <>
      {room ? <PlayerRoom config={stableConfig} room={room} /> : <PlayerWorld config={stableConfig} self={stableSelf} />}
      {loading
        ? createPortal(
            <div className="fixed inset-0 z-[2147483000] flex flex-col items-center justify-center gap-6 bg-[#05060a]/95 backdrop-blur-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/icons/faviconlit.png"
                alt="Cargando"
                className="size-20 animate-pulse select-none"
                draggable={false}
              />
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">Cargando…</p>
              <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-lime transition-[width] duration-150 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
