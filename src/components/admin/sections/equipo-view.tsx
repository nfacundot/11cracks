"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const JUGADORES = [
  { dorsal: 1, nombre: "Diego Marín", posicion: "Portero · Sub-17", asistencia: 94 },
  { dorsal: 8, nombre: "Carlos Herrera", posicion: "Mediocentro · Sub-17", asistencia: 92 },
  { dorsal: 3, nombre: "Samuel Rojas", posicion: "Defensa · Sub-17", asistencia: 90 },
  { dorsal: 4, nombre: "Tomás Gil", posicion: "Defensa · Sub-17", asistencia: 89 },
  { dorsal: 5, nombre: "Nicolás Peña", posicion: "Defensa · Sub-17", asistencia: 91 },
  { dorsal: 2, nombre: "Juan Esteban", posicion: "Defensa · Sub-17", asistencia: 87 },
  { dorsal: 6, nombre: "Mateo Salas", posicion: "Mediocentro · Sub-17", asistencia: 88 },
  { dorsal: 10, nombre: "Andrés Vera", posicion: "Mediocentro · Sub-17", asistencia: 86 },
  { dorsal: 11, nombre: "Valentina Torres", posicion: "Extremo · Sub-17", asistencia: 96 },
  { dorsal: 9, nombre: "Bruno Castro", posicion: "Delantero · Sub-17", asistencia: 84 },
  { dorsal: 7, nombre: "Iván Lozano", posicion: "Extremo · Sub-17", asistencia: 85 },
  { dorsal: 12, nombre: "Martín Ospina", posicion: "Portero · Sub-17", asistencia: 82 },
  { dorsal: 14, nombre: "Simón Castaño", posicion: "Defensa · Sub-17", asistencia: 83 },
];

export function EquipoView() {
  const [seleccionado, setSeleccionado] = useState(JUGADORES[0]);
  const [recomendacion, setRecomendacion] = useState("Trabaja recepción orientada con pierna izquierda.");
  const [dimension, setDimension] = useState("Técnica");

  const colorAsistencia = (pct: number) =>
    pct >= 90 ? "text-emerald-400" : pct >= 85 ? "text-[#E3C065]" : "text-red-400";

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · PLANTEL"
        title="Mi equipo"
        subtitle="Consulta, acompaña y sigue la evolución de tu plantel."
      />

      {/* ─── Lista de jugadores (vertical) ─── */}
      <div className="flex flex-col gap-3">
        {JUGADORES.map((j) => (
          <button
            key={j.dorsal}
            type="button"
            onClick={() => setSeleccionado(j)}
            className={`relative rounded-[12px] border px-4 py-2.5 transition ${
              seleccionado.dorsal === j.dorsal
                ? "border-[#C9A24A]/60 bg-[#0B0D0D] shadow-[0_0_0_1px_#C9A24A]"
                : "border-white/[0.05] bg-[#080909]/85 hover:border-[#C9A24A]/30"
            }`}
            style={{ fontFamily: S.barlow }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-[13px] font-extrabold"
                style={{ color: S.textPrimary }}
              >
                {j.dorsal}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold truncate" style={{ color: S.textPrimary }}>
                  {j.nombre}
                </p>
                <p className="text-[11px] font-medium truncate" style={{ color: S.textSecondary }}>
                  {j.posicion}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#686862]">
                  ASISTENCIA
                </span>
                <span
                  className={`text-[15px] font-extrabold ${colorAsistencia(j.asistencia)}`}
                  style={{ fontFamily: S.barlow }}
                >
                  {j.asistencia}%
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C9A24A]">
                  Ver ficha →
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ─── Ficha del jugador seleccionado ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          FICHA DEL JUGADOR
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_2fr]">
          <div className="flex flex-col items-center text-center md:text-left p-4 rounded-[12px] bg-white/[0.02] border border-white/[0.04]">
            <span
              className="w-20 h-20 flex items-center justify-center rounded-full bg-white/[0.05] text-3xl font-extrabold"
              style={{ color: S.textPrimary }}
            >
              {seleccionado.dorsal}
            </span>
            <p className="mt-3 text-[18px] font-bold" style={{ color: S.textPrimary }}>
              {seleccionado.nombre}
            </p>
            <p className="text-[12px] font-medium" style={{ color: S.textSecondary }}>
              {seleccionado.posicion}
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button className="rounded-[10px] border border-[#C9A24A]/25 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Evaluar
              </button>
              <button className="rounded-[10px] border border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/20 hover:bg-white/[0.03]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Ver asistencia
              </button>
              <button className="rounded-[10px] border border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/20 hover:bg-white/[0.03]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Ver progreso
              </button>
            </div>
            <div className="space-y-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#686862]" style={{ fontFamily: S.barlow }}>Recomendación</span>
                <input
                  type="text"
                  value={recomendacion}
                  onChange={(e) => setRecomendacion(e.target.value)}
                  className="rounded-[10px] border border-white/10 bg-[#080909] px-3 py-2 text-[13px] outline-none transition hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                  placeholder="Escribe una recomendación..."
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#686862]" style={{ fontFamily: S.barlow }}>Dimensión</span>
                <input
                  type="text"
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                  className="rounded-[10px] border border-white/10 bg-[#080909] px-3 py-2 text-[13px] outline-none transition hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                  placeholder="Dimensión (ej. Técnica, Táctica, Física...)"
                />
              </label>
            </div>
            <button className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 hover:border-[#C9A24A]/60" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Guardar recomendación
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}