"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

type Estado = "Publicado" | "Borrador";

const CONTENIDOS = [
  { id: "bilinguismo-sport", name: "Bilingüismo Sport", detail: "NeuroCracks · Experiencia", estado: "Publicado" as Estado },
  { id: "recepcion-orientada", name: "Recepción orientada", detail: "Entrenamiento · Video · 4 min", estado: "Publicado" as Estado },
  { id: "rutina-foco", name: "Rutina de foco pre-partido", detail: "Bienestar emocional · Material", estado: "Borrador" as Estado },
];

const BADGE: Record<Estado, string> = {
  Publicado: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  Borrador: "border-[#C9A24A]/30 bg-[#C9A24A]/10 text-[#E3C065]",
};

export function ContenidoView() {
  const [estados, setEstados] = useState<Record<string, Estado>>(
    Object.fromEntries(CONTENIDOS.map((c) => [c.id, c.estado])),
  );

  const cambiar = (id: string) =>
    setEstados((prev) => ({
      ...prev,
      [id]: prev[id] === "Publicado" ? "Borrador" : "Publicado",
    }));

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · NEUROCRACKS"
        title="Contenido"
        subtitle="Operación autorizada · alcance administrativo de tu organización."
      />

      {/* ─── Panel: Biblioteca publicada ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ fontFamily: S.barlow, color: S.textSecondary }}
        >
          Biblioteca publicada
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ fontFamily: S.barlow, color: "#686862" }}
              >
                <th className="pb-3 pr-4 font-semibold">Contenido</th>
                <th className="pb-3 pr-4 font-semibold">Detalle</th>
                <th className="pb-3 pr-4 font-semibold">Estado</th>
                <th className="pb-3 font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {CONTENIDOS.map((contenido) => (
                <tr key={contenido.id} className="border-t border-white/[0.05]">
                  <td
                    className="py-4 pr-4 text-[15px] font-bold"
                    style={{ fontFamily: S.barlow, color: S.textPrimary }}
                  >
                    {contenido.name}
                  </td>
                  <td
                    className="py-4 pr-4 text-[12px] font-medium"
                    style={{ fontFamily: S.barlow, color: S.textSecondary }}
                  >
                    {contenido.detail}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${BADGE[estados[contenido.id]]}`}
                      style={{ fontFamily: S.barlow }}
                    >
                      {estados[contenido.id]}
                    </span>
                  </td>
                  <td className="py-4">
                    <button
                      type="button"
                      onClick={() => cambiar(contenido.id)}
                      className="rounded-[10px] border border-[#C9A24A]/25 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
                      style={{ fontFamily: S.barlow, color: S.textPrimary }}
                    >
                      Cambiar estado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
