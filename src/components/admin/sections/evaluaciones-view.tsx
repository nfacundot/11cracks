"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const DEPORTE = [
  { label: "Técnica", key: "tecnica" },
  { label: "Velocidad", key: "velocidad" },
  { label: "Resistencia", key: "resistencia" },
  { label: "Coordinación", key: "coordinacion" },
  { label: "Decisión", key: "decision" },
  { label: "Lectura de juego", key: "lectura" },
];

const NEUROCRACKS = [
  { label: "Atención", key: "atencion" },
  { label: "Memoria", key: "memoria" },
  { label: "Flexibilidad", key: "flexibilidad" },
  { label: "Inhibición", key: "inhibicion" },
  { label: "Planificación", key: "planificacion" },
  { label: "Velocidad mental", key: "velocidadMental" },
];

const DEFAULT_VALUES = {
  tecnica: 72,
  velocidad: 68,
  resistencia: 81,
  coordinacion: 75,
  decision: 66,
  lectura: 70,
  atencion: 70,
  memoria: 76,
  flexibilidad: 67,
  inhibicion: 72,
  planificacion: 63,
  velocidadMental: 74,
};

function PanelEvaluacion({ titulo, items, values, onChange }: {
  titulo: string;
  items: { label: string; key: string }[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}) {
  return (
    <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
        {titulo}
      </h3>
      <div className="mt-4 space-y-5">
        {items.map((item) => (
          <div key={item.key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                {item.label}
              </span>
              <span className="shrink-0 w-12 text-right text-[13px] font-bold text-[#C9A24A]" style={{ fontFamily: S.barlow }}>
                {values[item.key]}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={values[item.key]}
              onChange={(e) => onChange(item.key, e.target.valueAsNumber)}
              className="h-2 appearance-none bg-white/[0.05] rounded-full accent-[#C9A24A] cursor-pointer"
            />
          </div>
        ))}
      </div>
      <div className="mt-6 text-right">
        <button
          type="button"
          className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 hover:border-[#C9A24A]/60"
          style={{ fontFamily: S.barlow, color: S.textPrimary }}
        >
          Guardar evaluación
        </button>
      </div>
    </section>
  );
}

export function EvaluacionesView() {
  const [values, setValues] = useState<Record<string, number>>(DEFAULT_VALUES);

  const handleChange = (key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · OBSERVACIÓN"
        title="Evaluar"
        subtitle="Registra lo que observaste en cancha."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PanelEvaluacion
          titulo="Deporte · Carlos Herrera"
          items={DEPORTE}
          values={values}
          onChange={handleChange}
        />
        <PanelEvaluacion
          titulo="NeuroCracks · Carlos Herrera"
          items={NEUROCRACKS}
          values={values}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}