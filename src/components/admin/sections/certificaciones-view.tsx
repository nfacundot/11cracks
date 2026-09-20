"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const OBJETIVO_H = 540;

export function CertificacionesView() {
  const [horas, setHoras] = useState({ registradas: 140, pendientes: 2, validadas: 128 });
  const [cantidad, setCantidad] = useState(2);

  const validar = () => {
    const n = Math.min(Math.max(cantidad, 1), horas.pendientes);
    if (Number.isNaN(n) || horas.pendientes === 0) return;
    setHoras((h) => ({
      ...h,
      pendientes: h.pendientes - n,
      validadas: h.validadas + n,
    }));
    setCantidad(1);
  };

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · TRAZABILIDAD"
        title="Certificaciones y horas"
        subtitle="Operación autorizada · alcance administrativo de tu organización."
      />

      {/* ─── Panel: Horas bajo revisión ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ fontFamily: S.barlow, color: S.textSecondary }}
        >
          Horas bajo revisión
        </h3>

        <div className="mt-4 rounded-[12px] border border-white/[0.05] bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                className="text-[15px] font-bold"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                Carlos Herrera
              </p>
              <p
                className="mt-1 text-[12px] font-medium"
                style={{ fontFamily: S.barlow, color: S.textSecondary }}
              >
                Forjadores Pro · Fuente: Entrenamiento · Coach
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={horas.pendientes}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.valueAsNumber)}
                disabled={horas.pendientes === 0}
                className="w-16 rounded-[10px] border border-[#C9A24A]/25 tk-panel-solid px-2 py-2 text-center text-[13px] font-bold outline-none transition hover:border-[#C9A24A]/50 disabled:opacity-40"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              />
              <button
                type="button"
                onClick={validar}
                disabled={horas.pendientes === 0}
                className="rounded-[10px] border border-[#C9A24A]/25 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10 disabled:opacity-40 disabled:hover:border-[#C9A24A]/25 disabled:hover:bg-transparent"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                Validar
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Stat label="registradas" value={horas.registradas} />
            <Stat label="pendientes" value={horas.pendientes} highlight={horas.pendientes > 0} />
            <Stat label="validadas" value={horas.validadas} />
          </div>
        </div>

        <p
          className="mt-5 border-t border-white/[0.05] pt-4 text-[11px] font-medium"
          style={{ fontFamily: S.barlow, color: "#686862" }}
        >
          Objetivo de certificación: {OBJETIVO_H} h
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span
        className={`text-[18px] font-extrabold ${highlight ? "text-[#E3C065]" : ""}`}
        style={{ fontFamily: S.barlow, color: highlight ? undefined : S.textPrimary }}
      >
        {value}
      </span>
      <span
        className="text-[11px] font-medium uppercase tracking-[0.1em]"
        style={{ fontFamily: S.barlow, color: S.textSecondary }}
      >
        {label}
      </span>
    </span>
  );
}
