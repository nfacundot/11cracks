"use client";

import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

export function CampusView() {
  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · EQUIPO"
        title="Seguimiento"
        subtitle="Acompaña el avance de tus jugadores."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Panel 1: Asistencia del equipo */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
            Asistencia del equipo
          </h3>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-[48px] font-extrabold text-[#C9A24A]" style={{ fontFamily: S.barlow, lineHeight: 1 }}>
              90%
            </span>
            <span className="text-[11px] font-medium text-[#686862]" style={{ fontFamily: S.barlow }}>
              Promedio de las últimas sesiones
            </span>
          </div>
          <div className="mt-4 h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-[#C9A24A] rounded-full" style={{ width: "90%" }} />
          </div>
        </section>

        {/* Panel 2: Evaluaciones */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
            Evaluaciones
          </h3>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-[48px] font-extrabold text-[#C9A24A]" style={{ fontFamily: S.barlow, lineHeight: 1 }}>
              6/6
            </span>
            <span className="text-[11px] font-medium text-[#686862]" style={{ fontFamily: S.barlow }}>
              Dimensiones con observación vigente
            </span>
          </div>
          <div className="mt-4 h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: "100%" }} />
          </div>
        </section>

        {/* Panel 3: Horas validadas */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
            Horas validadas
          </h3>
          <div className="mt-4 flex items-end justify-between">
            <span className="text-[48px] font-extrabold text-[#C9A24A]" style={{ fontFamily: S.barlow, lineHeight: 1 }}>
              130 h
            </span>
            <span className="text-[11px] font-medium text-[#686862]" style={{ fontFamily: S.barlow }}>
              Objetivo del programa: 540 h
            </span>
          </div>
          <div className="mt-4 h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: "24%" }} />
          </div>
        </section>

        {/* Panel 4: Qué notar hoy */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#AAA69C]" style={{ fontFamily: S.barlow }}>
            Qué notar hoy
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <span className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Jugadores bajo 88% asistencia
              </span>
              <span className="text-[20px] font-extrabold text-red-400" style={{ fontFamily: S.barlow }}>
                6
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
              <span className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Horas pendientes de validar
              </span>
              <span className="text-[20px] font-extrabold text-emerald-400" style={{ fontFamily: S.barlow }}>
                0 h
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Dimensiones con progreso registrado
              </span>
              <span className="text-[20px] font-extrabold text-[#C9A24A]" style={{ fontFamily: S.barlow }}>
                6/6
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}