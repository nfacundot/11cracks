"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const FILTROS = ["Club", "Player", "Asistencia", "Horas", "Impacto"];

type Decision = "Aprobar" | "Rechazar";
type Estado = "Pendiente" | "Aprobada" | "Rechazada";

const BADGE: Record<Estado, string> = {
  Pendiente: "border-[#C9A24A]/30 bg-[#C9A24A]/10 text-[#E3C065]",
  Aprobada: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  Rechazada: "border-red-500/25 bg-red-500/10 text-red-400",
};

export function ReportesView() {
  const [filtroActivo, setFiltroActivo] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision>("Aprobar");
  const [estado, setEstado] = useState<Estado>("Pendiente");

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · LECTURA OPERATIVA"
        title="Reportes"
        subtitle="Operación autorizada · alcance administrativo de tu organización."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* ─── Panel: Filtros disponibles ─── */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            Filtros disponibles
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTROS.map((filtro) => {
              const activo = filtroActivo === filtro;
              return (
                <button
                  key={filtro}
                  type="button"
                  onClick={() => setFiltroActivo(activo ? null : filtro)}
                  className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition ${
                    activo
                      ? "border-[#C9A24A]/60 bg-[#C9A24A]/15 text-[#E3C065]"
                      : "border-white/10 bg-white/[0.03] text-[#AAA69C] hover:border-[#C9A24A]/30 hover:text-[#F3F0E8]"
                  }`}
                  style={{ fontFamily: S.barlow }}
                >
                  {filtro}
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── Panel: Postulaciones ─── */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            Postulaciones de jugador destacado
          </h3>

          <div className="mt-4 rounded-[12px] border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <span
                className="text-[15px] font-bold"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                Carlos Herrera
              </span>
              <span
                className={`inline-block shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${BADGE[estado]}`}
                style={{ fontFamily: S.barlow }}
              >
                {estado}
              </span>
            </div>
            <p
              className="mt-1 text-[12px] font-medium"
              style={{ fontFamily: S.barlow, color: S.textSecondary }}
            >
              Forjadores Pro · propuesta de Mateo Ríos
            </p>

            {estado === "Pendiente" && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as Decision)}
                  className="rounded-[10px] border border-[#C9A24A]/25 bg-[#080909] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] outline-none transition hover:border-[#C9A24A]/50"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                >
                  <option value="Aprobar">Aprobar</option>
                  <option value="Rechazar">Rechazar</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setEstado(decision === "Aprobar" ? "Aprobada" : "Rechazada")
                  }
                  className="rounded-[10px] border border-[#C9A24A]/25 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                >
                  Registrar decisión
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
