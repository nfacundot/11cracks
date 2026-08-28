"use client";

import Link from "next/link";
import { useState } from "react";

type EvolutionMode = "sport" | "neurocracks";

export type EvolutionAxis = readonly [number, number, number, number, number, number];

export type PlayerHomeEvolution = {
  sport: { label: string; current: EvolutionAxis; previous: EvolutionAxis };
  neurocracks: { label: string; current: EvolutionAxis; previous: EvolutionAxis };
};

const axes = 6;
const center = 100;
const radius = 76;

function pointsFor(values: readonly number[], scale = 1) {
  return values
    .map((value, index) => {
      const angle = (-90 + index * (360 / axes)) * (Math.PI / 180);
      const distance = radius * scale * (Math.max(0, Math.min(100, value)) / 100);
      return `${center + Math.cos(angle) * distance},${center + Math.sin(angle) * distance}`;
    })
    .join(" ");
}

function gridPoints(scale: number) {
  return pointsFor([100, 100, 100, 100, 100, 100], scale);
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

export function PlayerEvolutionPreview({ evolution }: { evolution: PlayerHomeEvolution }) {
  const [mode, setMode] = useState<EvolutionMode>("sport");
  const series = evolution[mode];
  const currentPoints = pointsFor(series.current);
  const previousPoints = pointsFor(series.previous);

  return (
    <section className="player-evolution" data-mode={mode} aria-labelledby="player-evolution-title">
      <div className="player-evolution__copy">
        <h2 id="player-evolution-title">Tu evolución</h2>

        <div className="player-evolution__switch" role="group" aria-label="Seleccionar vista de evolución">
          <button type="button" aria-pressed={mode === "sport"} onClick={() => setMode("sport")}>Deporte</button>
          <button type="button" aria-pressed={mode === "neurocracks"} onClick={() => setMode("neurocracks")}>NeuroCracks</button>
          <span aria-hidden="true" data-position={mode} />
        </div>
      </div>

      <Link
        href="/jugador/progress"
        className="player-evolution__visual"
        data-redraw={mode}
        aria-label={`Abrir Mi progreso en ${series.label}`}
      >
        <svg viewBox="0 0 200 200" role="img" aria-label={`Radar resumido de ${series.label}`}>
          <g className="player-evolution__grid" aria-hidden="true">
            {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={gridPoints(scale)} />)}
            {Array.from({ length: axes }, (_, index) => {
              const angle = (-90 + index * (360 / axes)) * (Math.PI / 180);
              return <line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} />;
            })}
          </g>
          <polygon className="player-evolution__previous" points={previousPoints} aria-hidden="true" />
          <polygon key={mode} className="player-evolution__current" points={currentPoints} />
          <circle className="player-evolution__center" cx={center} cy={center} r="3" aria-hidden="true" />
        </svg>
        <span className="player-evolution__legend"><i /> Periodo actual <i /> Periodo anterior</span>
      </Link>

      <Link href="/jugador/progress" className="player-evolution__cta">
        <span>Ver mi progreso</span>
        <ArrowIcon />
      </Link>
    </section>
  );
}
