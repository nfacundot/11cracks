"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const JUGADORES = [
  { id: 1, nombre: "Diego Marín", posicion: "Portero · #1" },
  { id: 8, nombre: "Carlos Herrera", posicion: "Mediocentro · #8" },
  { id: 3, nombre: "Samuel Rojas", posicion: "Defensa · #3" },
  { id: 4, nombre: "Tomás Gil", posicion: "Defensa · #4" },
  { id: 5, nombre: "Nicolás Peña", posicion: "Defensa · #5" },
  { id: 2, nombre: "Juan Esteban", posicion: "Defensa · #2" },
  { id: 6, nombre: "Mateo Salas", posicion: "Mediocentro · #6" },
  { id: 10, nombre: "Andrés Vera", posicion: "Mediocentro · #10" },
  { id: 11, nombre: "Valentina Torres", posicion: "Extremo · #11" },
  { id: 9, nombre: "Bruno Castro", posicion: "Delantero · #9" },
  { id: 7, nombre: "Iván Lozano", posicion: "Extremo · #7" },
];

const SESIONES = [
  { value: "1", label: "12 AGO · Técnica individual · 2 h" },
  { value: "2", label: "5 AGO · Táctica grupal · 1.5 h" },
  { value: "3", label: "29 JUL · Física + definición · 2 h" },
];

const ESTADOS = [
  { value: "asistio", label: "Asistió" },
  { value: "ausente", label: "Ausente" },
  { value: "pendiente", label: "Pendiente" },
];

export function AsistenciaView() {
  const [sesion, setSesion] = useState("1");
  const [asistencias, setAsistencias] = useState<Record<number, string>>({});
  const [horasValidar, setHorasValidar] = useState(2);

  const handleAsistencia = (jugadorId: number, estado: string) => {
    setAsistencias((prev) => ({ ...prev, [jugadorId]: estado }));
  };

  const validarHoras = () => {
    // Lógica de validación (maqueta)
    alert(`Validando ${horasValidar} horas para Carlos Herrera`);
  };

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · ASISTENCIA"
        title="Entrenamientos"
        subtitle="Confirma quién estuvo y valida la sesión."
      />

      {/* ─── Panel 1: Sesión seleccionada ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Sesión seleccionada
        </h3>

        {/* Selector de sesión */}
        <div className="mt-4 mb-6">
          <label className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#686862] shrink-0" style={{ fontFamily: S.barlow }}>Sesión</span>
            <select
              value={sesion}
              onChange={(e) => setSesion(e.target.value)}
              className="flex-1 rounded-[10px] border border-white/10 bg-[#080909] px-3 py-2 text-[13px] outline-none transition hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              {SESIONES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        {/* Lista de jugadores */}
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {JUGADORES.map((j) => (
            <div
              key={j.id}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-white/[0.05] bg-white/[0.02] p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold truncate" style={{ color: S.textPrimary }}>
                  {j.nombre}
                </p>
                <p className="text-[11px] font-medium truncate" style={{ color: S.textSecondary }}>
                  {j.posicion}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={asistencias[j.id] || "pendiente"}
                  onChange={(e) => handleAsistencia(j.id, e.target.value)}
                  className="flex-1 min-w-[130px] rounded-[8px] border border-white/10 bg-[#080909] px-2 py-1.5 text-[11px] outline-none transition hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                >
                  {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => alert(`Guardando asistencia de ${j.nombre}: ${asistencias[j.id] || "pendiente"}`)}
                  className="shrink-0 rounded-[8px] border border-[#C9A24A]/25 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                >
                  Guardar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Panel 2: Horas de Carlos Herrera ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
          Horas de Carlos Herrera
        </h3>

        <div className="mt-4 space-y-3">
          <p className="text-[13px] font-medium" style={{ color: S.textPrimary }}>
            Carlos Herrera · Entrenamiento técnico · 2 h registradas
          </p>
          <p className="text-[12px] font-medium text-[#E3C065]" style={{ fontFamily: S.barlow }}>
            2 h pendientes de validar
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/[0.05]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#686862] shrink-0" style={{ fontFamily: S.barlow }}>
              Horas a validar
            </span>
            <input
              type="number"
              min={1}
              max={2}
              value={horasValidar}
              onChange={(e) => setHorasValidar(e.target.valueAsNumber)}
              className="w-20 rounded-[8px] border border-white/10 bg-[#080909] px-2 py-1.5 text-center text-[13px] outline-none transition hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            />
            <button
              type="button"
              onClick={validarHoras}
              className="rounded-[8px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 hover:border-[#C9A24A]/60"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              Validar horas
            </button>
          </div>

          <p className="text-[11px] font-medium text-[#686862]" style={{ fontFamily: S.barlow }}>
            Acumulado validado de Carlos Herrera: 128 / 540 h.
          </p>
        </div>
      </section>
    </div>
  );
}