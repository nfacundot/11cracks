"use client";

import Link from "next/link";
import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { logout } from "@/actions/auth";
import { LogOutIcon } from "@/components/icons";

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
        on ? "border-[#C9A24A]/60 bg-[#C9A24A]/30" : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <span
        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${
          on ? "left-[24px] bg-[#E3C065]" : "left-[3px] bg-[#686862]"
        }`}
      />
    </button>
  );
}

export function ConfiguracionView() {
  const [movimientoReducido, setMovimientoReducido] = useState(false);

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="CONTROL DE TU EXPERIENCIA"
        title="Configuración"
        subtitle="Ajusta lo esencial de tu cuenta y de cómo usas 11 Cracks."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* ─── Panel 1: Experiencia ─── */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Experiencia
          </h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Solo en este dispositivo
          </p>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-[12px] border border-white/[0.05] bg-white/[0.02] p-4">
            <div className="min-w-0">
              <p className="text-[14px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Movimiento reducido
              </p>
              <p className="mt-0.5 text-[11px] font-medium leading-snug" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                Limita transiciones y animaciones de la interfaz.
              </p>
            </div>
            <Switch on={movimientoReducido} onToggle={() => setMovimientoReducido((v) => !v)} />
          </div>
        </section>

        {/* ─── Panel 2: Cuenta ─── */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
          <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Cuenta
          </h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Accesos rápidos
          </p>

          <div className="mt-4 space-y-2.5">
            <Link
              href="/jugador/profile"
              className="flex items-center justify-between rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 transition hover:border-[#C9A24A]/30"
            >
              <span className="text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                Abrir mi perfil
              </span>
              <span className="text-[13px] font-bold" style={{ fontFamily: S.barlow, color: "#686862" }}>
                →
              </span>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center justify-between rounded-[10px] border border-red-500/20 bg-red-500/[0.06] px-3 py-2.5 transition hover:border-red-500/40 hover:bg-red-500/15"
              >
                <span className="flex items-center gap-2 text-[13px] font-bold text-red-400" style={{ fontFamily: S.barlow }}>
                  <LogOutIcon className="h-4 w-4 shrink-0" />
                  Cerrar sesión
                </span>
                <span className="text-[13px] font-bold text-red-400" style={{ fontFamily: S.barlow }}>
                  →
                </span>
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* ─── Panel 3: Privacidad ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: S.barlow, color: S.gold }}>
          Privacidad
        </h3>
        <p className="mt-2 max-w-2xl text-[13px] font-medium leading-relaxed" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
          Este entorno demo guarda preferencias locales en tu dispositivo. Tus datos de jugador permanecen dentro del alcance de tu cuenta.
        </p>
      </section>
    </div>
  );
}