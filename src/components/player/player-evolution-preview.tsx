"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { DataVizTooltip, useDataVizInteraction } from "@/components/shared/data-viz-interaction";

type EvolutionMode = "sport" | "neurocracks";

export type EvolutionAxis = readonly [number, number, number, number, number, number];

export type PlayerHomeEvolution = {
  sport: { label: string; current: EvolutionAxis; previous: EvolutionAxis };
  neurocracks: { label: string; current: EvolutionAxis; previous: EvolutionAxis };
};

const sportDimensionLabels = ["Técnica", "Velocidad", "Ofensivo", "Defensivo", "Lectura de juego", "Polifuncionalidad"] as const;
const neuroDimensionLabels = ["Atención", "Memoria", "Flexibilidad", "Inhibición", "Planificación", "Velocidad mental"] as const;

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

export function PlayerEvolutionPreview({ evolution, variant = "default" }: { evolution: PlayerHomeEvolution; variant?: "default" | "home" }) {
  const [mode, setMode] = useState<EvolutionMode>("sport");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { rootRef, activeId, activate } = useDataVizInteraction();
  const pointRefs = useMemo(() => Array.from({ length: axes }, () => ({ current: null as HTMLButtonElement | null })), []);
  const series = evolution[mode];
  const labels = mode === "sport" ? sportDimensionLabels : neuroDimensionLabels;
  const radarSeries = labels.map((label, index) => ({ id: label.toLowerCase().replaceAll(" ", "-"), label, current: series.current[index], previous: series.previous[index] }));
  const selected = radarSeries[selectedIndex] ?? radarSeries[0];
  const selectedDatum = selected ? { id: selected.id, label: selected.label, value: selected.current, secondary: `Anterior: ${selected.previous} / 100` } : null;

  return (
    <section className={`player-evolution${variant === "home" ? " player-evolution--home" : ""}`} data-mode={mode} data-testid={variant === "home" ? "player-home-hexagon" : undefined} aria-labelledby="player-evolution-title">
      <div className="player-evolution__copy">
        <h2 id="player-evolution-title">{variant === "home" ? "TU EVOLUCIÓN" : "Tu evolución"}</h2>

        <div className="player-evolution__switch" role="group" aria-label="Seleccionar vista de evolución">
          <button type="button" aria-pressed={mode === "sport"} onClick={() => setMode("sport")}>Deporte</button>
          <button type="button" aria-pressed={mode === "neurocracks"} onClick={() => setMode("neurocracks")}>NeuroCracks</button>
          <span aria-hidden="true" data-position={mode} />
        </div>
      </div>

      <div
        ref={rootRef}
        className="player-evolution__visual"
        data-redraw={mode}
        aria-label={`Abrir Mi progreso en ${series.label}`}
      >
        <div className="player-progress-radar__chart player-evolution__progress-chart">
          <svg viewBox="0 0 200 200" role="img" aria-label={`Radar resumido de ${series.label}`}>
            <g className="player-evolution__grid" aria-hidden="true">
              {[0.25, 0.5, 0.75, 1].map((scale) => <polygon key={scale} points={gridPoints(scale)} />)}
              {Array.from({ length: axes }, (_, index) => {
                const angle = (-90 + index * (360 / axes)) * (Math.PI / 180);
                return <line key={index} x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} />;
              })}
            </g>
            <polygon className="player-evolution__previous" points={pointsFor(series.previous)} aria-hidden="true" />
            <polygon key={mode} className="player-evolution__current" points={pointsFor(series.current)} />
            <circle className="player-evolution__center" cx={center} cy={center} r="3" aria-hidden="true" />
          </svg>
          {radarSeries.map((dimension, index) => {
            const angle = (-90 + index * (360 / axes)) * (Math.PI / 180);
            const point = { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius };
            return (
              <button
                key={dimension.id}
                type="button"
                className="player-progress-radar__point"
                ref={pointRefs[index]}
                data-selected={selectedIndex === index}
                style={{ "--point-x": `${point.x / 2}%`, "--point-y": `${point.y / 2}%` } as CSSProperties}
                aria-label={`${dimension.label}: ${dimension.current} de 100. Anterior: ${dimension.previous} de 100`}
                aria-pressed={selectedIndex === index}
                onClick={() => { setSelectedIndex(index); activate(dimension.id); }}
                onMouseEnter={() => { setSelectedIndex(index); activate(dimension.id); }}
                onFocus={() => { setSelectedIndex(index); activate(dimension.id); }}
              />
            );
          })}
        </div>
        {selectedDatum ? <DataVizTooltip datum={selectedDatum} anchorRef={pointRefs[selectedIndex]} visible={activeId === selected.id} accent={mode === "sport" ? "var(--context-progress)" : "var(--context-neurocracks)"} /> : null}
        <span className="player-evolution__legend"><i /> Periodo actual <i /> Periodo anterior</span>
      </div>

      {variant === "home" && mode === "sport" ? <div className="player-evolution__dimensions" aria-label="Dimensiones deportivas">{sportDimensionLabels.map((label) => <span key={label}>{label}</span>)}</div> : null}

      <Link href="/jugador/progress" className="player-evolution__cta">
        <span>Ver mi progreso</span>
        <ArrowIcon />
      </Link>
    </section>
  );
}