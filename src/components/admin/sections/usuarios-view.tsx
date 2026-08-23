"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { LockIcon } from "@/components/icons";

type Estado = "Activo" | "Pendiente" | "Inactivo";

const USUARIOS = [
  { id: "carlos-herrera", name: "Carlos Herrera", detail: "Player · Forjadores Pro", estado: "Activo" as Estado },
  { id: "mateo-rios", name: "Mateo Ríos", detail: "Coach · Forjadores Pro", estado: "Activo" as Estado },
  { id: "valentina-torres", name: "Valentina Torres", detail: "Player · Campus 11 Cracks", estado: "Pendiente" as Estado },
];

const SIGUIENTE: Record<Estado, Estado> = {
  Pendiente: "Activo",
  Activo: "Inactivo",
  Inactivo: "Activo",
};

const BADGE: Record<Estado, string> = {
  Activo: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  Pendiente: "border-[#C9A24A]/30 bg-[#C9A24A]/10 text-[#E3C065]",
  Inactivo: "border-white/10 bg-white/[0.04] text-[#686862]",
};

export function UsuariosView() {
  const [estados, setEstados] = useState<Record<string, Estado>>(
    Object.fromEntries(USUARIOS.map((u) => [u.id, u.estado])),
  );

  const cambiar = (id: string) =>
    setEstados((prev) => ({ ...prev, [id]: SIGUIENTE[prev[id]] }));

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="ADMIN · ACCESOS"
        title="Usuarios"
        subtitle="Operación autorizada · alcance administrativo de tu organización"
      />

      {/* ─── Panel: Usuarios dentro del alcance ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <h3
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ fontFamily: S.barlow, color: S.textSecondary }}
        >
          Usuarios dentro del alcance
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ fontFamily: S.barlow, color: "#686862" }}
              >
                <th className="pb-3 pr-4 font-semibold">Usuario</th>
                <th className="pb-3 pr-4 font-semibold">Detalle</th>
                <th className="pb-3 pr-4 font-semibold">Estado</th>
                <th className="pb-3 font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {USUARIOS.map((usuario) => (
                <tr key={usuario.id} className="border-t border-white/[0.05]">
                  <td
                    className="whitespace-nowrap py-4 pr-4 text-[15px] font-bold"
                    style={{ fontFamily: S.barlow, color: S.textPrimary }}
                  >
                    {usuario.name}
                  </td>
                  <td
                    className="py-4 pr-4 text-[12px] font-medium"
                    style={{ fontFamily: S.barlow, color: S.textSecondary }}
                  >
                    {usuario.detail}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${BADGE[estados[usuario.id]]}`}
                      style={{ fontFamily: S.barlow }}
                    >
                      {estados[usuario.id]}
                    </span>
                  </td>
                  <td className="py-4">
                    <button
                      type="button"
                      onClick={() => cambiar(usuario.id)}
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

        <p
          className="mt-5 flex items-center gap-2 border-t border-white/[0.05] pt-4 text-[11px] font-medium"
          style={{ fontFamily: S.barlow, color: "#686862" }}
        >
          <LockIcon className="h-3.5 w-3.5 shrink-0" />
          La asignación de Super Admin no está disponible en este alcance.
        </p>
      </section>
    </div>
  );
}
