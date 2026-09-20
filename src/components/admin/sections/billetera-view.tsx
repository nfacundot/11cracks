"use client";

import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

export function BilleteraView() {
  const FUENTES = [
    { label: "Eventos", value: "$18.400" },
    { label: "Plan Padrino", value: "$12.800" },
    { label: "Cuidado del planeta", value: "1.240 botellas" },
  ];

  const INDICADORES = [
    { label: "Beneficiarios apoyados", value: "42" },
    { label: "Uniformes entregados", value: "36" },
    { label: "Jugadores promovidos", value: "8" },
  ];

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · IMPACTO"
        title="Billetera e impacto"
        subtitle="Operación autorizada · alcance administrativo de tu organización."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* ─── Panel 1: Fuentes operativas ─── */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            Fuentes operativas
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {FUENTES.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                <span
                  className="text-[13px] font-medium"
                  style={{ fontFamily: S.barlow, color: S.textSecondary }}
                >
                  {item.label}
                </span>
                <span
                  className="text-[15px] font-bold"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Panel 2: Indicadores de impacto ─── */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            Indicadores de impacto
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {INDICADORES.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                <span
                  className="text-[13px] font-medium"
                  style={{ fontFamily: S.barlow, color: S.textSecondary }}
                >
                  {item.label}
                </span>
                <span
                  className="text-[22px] font-extrabold"
                  style={{ fontFamily: S.barlow, color: S.textPrimary }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}