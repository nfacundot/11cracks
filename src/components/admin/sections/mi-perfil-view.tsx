"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { logout } from "@/actions/auth";
import { LogOutIcon } from "@/components/icons";
import { roleLabel } from "@/lib/roles";

const DATOS_DEPORTIVOS = [
  { etiqueta: "Club", valor: "Forjadores Pro", registrado: true },
  { etiqueta: "Categoría", valor: "No registrada", registrado: false },
  { etiqueta: "Posición", valor: "No registrada", registrado: false },
  { etiqueta: "Dorsal", valor: "No registrado", registrado: false },
];

export function MiPerfilView({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const [archivo, setArchivo] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  return (
    <div className="flex flex-col gap-6 pt-12">
      {/* ─── Hero con club/jugador ─── */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <GlobalHero
          eyebrow="TU IDENTIDAD"
          title="Mi perfil"
          subtitle="Mantén actualizada tu identidad personal y deportiva."
        />
        <div className="shrink-0 rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 px-6 py-4 text-right">
          <p className="text-[14px] font-extrabold uppercase tracking-tight" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Forjadores Pro
          </p>
          <p className="text-[12px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            {user.name}
          </p>
        </div>
      </div>

      {/* ─── Panel completo: foto + identidad ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          {/* Foto */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
              Foto de {user.name.split(" ")[0]}
            </span>
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-[#C9A24A]/40 bg-[#C9A24A]/10">
              {archivo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={archivo} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-[#E3C065]" style={{ fontFamily: S.barlow }}>
                  {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
              )}
            </div>
            <label className="cursor-pointer rounded-[10px] border border-[#C9A24A]/25 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Cambiar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setArchivo(URL.createObjectURL(f));
                }}
              />
            </label>
            <span className="text-[10px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
              {archivo ? "1 archivo seleccionado" : "Sin archivos seleccionados"}
            </span>
          </div>

          {/* Identidad */}
          <div className="flex flex-col justify-center border-t border-white/[0.05] pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: S.barlow, color: S.gold }}>
              Identidad Player
            </span>
            <p className="mt-2 text-[26px] font-extrabold uppercase leading-none tracking-tight" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              {user.name}
            </p>
            <p className="mt-2 text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
              Forjadores Pro · Forjadores Pro · Rionegro
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 hover:border-[#C9A24A]/60"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                Guardar foto
              </button>
              <button
                type="button"
                onClick={() => setArchivo(null)}
                className="rounded-[10px] border border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/20 hover:bg-white/[0.03]"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Perfil deportivo + Cuenta ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Perfil deportivo */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Perfil deportivo
          </h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Datos registrados
          </p>
          <div className="mt-4 space-y-2.5">
            {DATOS_DEPORTIVOS.map((d) => (
              <div key={d.etiqueta} className="flex items-center justify-between rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <span className="text-[12px] font-medium uppercase tracking-[0.06em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
                  {d.etiqueta}
                </span>
                <span
                  className={`text-[13px] font-bold ${d.registrado ? "" : "italic opacity-60"}`}
                  style={{ fontFamily: S.barlow, color: d.registrado ? S.textPrimary : S.textSecondary }}
                >
                  {d.valor}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Cuenta */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Cuenta
          </h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Acceso actual
          </p>
          <div className="mt-4 space-y-2.5">
            {[
              { etiqueta: "Correo", valor: user.email },
              { etiqueta: "Rol", valor: roleLabel(user.role) },
              { etiqueta: "Club", valor: "Forjadores Pro" },
            ].map((c) => (
              <div key={c.etiqueta} className="flex items-center justify-between rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <span className="text-[12px] font-medium uppercase tracking-[0.06em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
                  {c.etiqueta}
                </span>
                <span className="max-w-[60%] truncate text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                  {c.valor}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-white/[0.05] pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
              Cambiar contraseña
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="min-w-0 flex-1 rounded-[10px] border border-white/10 bg-[#080909] px-3 py-2 text-[13px] outline-none transition hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              />
              <button
                type="button"
                className="rounded-[10px] border border-[#C9A24A]/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-[#C9A24A]/50 hover:bg-[#C9A24A]/10"
                style={{ fontFamily: S.barlow, color: S.textPrimary }}
              >
                Actualizar
              </button>
            </div>
          </div>

          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-400 transition hover:bg-red-500/20 hover:border-red-500/50"
              style={{ fontFamily: S.barlow }}
            >
              <LogOutIcon className="h-4 w-4 shrink-0" />
              Cerrar sesión
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}