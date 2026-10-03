"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { PlayerProgress } from "@/components/player/player-progress";

type ProgressProps = ComponentProps<typeof PlayerProgress>;

export default function ProgressScreen() {
  const [data, setData] = useState<ProgressProps | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/progress", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((payload: ProgressProps) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">
        No se pudo cargar Mi Progreso.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">
        Cargando Mi Progreso…
      </div>
    );
  }

  return <PlayerProgress fixture={data.fixture} racha={data.racha} />;
}
