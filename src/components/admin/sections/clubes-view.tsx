"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const CLUBES = [
  {
    id: "forjadores-pro",
    name: "Forjadores Pro",
    detail: "Santiago · Chile · 24 jugadores · 3 coaches",
  },
  {
    id: "campus-11-cracks",
    name: "Campus 11 Cracks",
    detail: "Bogotá · Colombia · 18 jugadores · 2 coaches",
  },
];

export function ClubesView() {
  const [inactivos, setInactivos] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setInactivos((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        title="Clubes"
        subtitle="Operación autorizada · alcance administrativo de tu organización."
      />

      {/* ─── Panel: Clubes en alcance ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ fontFamily: S.barlow, color: S.textSecondary }}
        >
          Clubes en alcance
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ fontFamily: S.barlow, color: "#686862" }}
              >
                <th className="pb-3 pr-4 font-semibold">Club</th>
                <th className="pb-3 pr-4 font-semibold">Detalle</th>
                <th className="pb-3 pr-4 font-semibold">Estado</th>
                <th className="pb-3 font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {CLUBES.map((club) => {
                const activo = !inactivos[club.id];
                return (
                  <tr key={club.id} className="border-t border-white/[0.05]">
                    <td
                      className="whitespace-nowrap py-4 pr-4 text-[15px] font-bold"
                      style={{ fontFamily: S.barlow, color: S.textPrimary }}
                    >
                      {club.name}
                    </td>
                    <td
                      className="py-4 pr-4 text-[12px] font-medium"
                      style={{ fontFamily: S.barlow, color: S.textSecondary }}
                    >
                      {club.detail}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                          activo
                            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                            : "border-white/10 bg-white/[0.04] text-[#686862]"
                        }`}
                        style={{ fontFamily: S.barlow }}
                      >
                        {activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="py-4">
                      <button
                        type="button"
                        onClick={() => toggle(club.id)}
                        className="rounded-[10px] border border-[#C9A24A]/25 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
                        style={{ fontFamily: S.barlow, color: S.textPrimary }}
                      >
                        Cambiar estado
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
