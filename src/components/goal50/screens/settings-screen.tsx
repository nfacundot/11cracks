"use client";

import { useState } from "react";
import { useDesktopActions } from "../launcher";

const CARD_STYLE = { background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" } as const;
const CHIP_STYLE = { background: "var(--g50-tile)", borderColor: "var(--g50-glass-border)" } as const;

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
        on ? "border-lime/60 bg-lime/30" : "border-white/10 bg-white/[0.05]"
      }`}
    >
      <span
        className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${
          on ? "left-[24px] bg-lime" : "left-[3px] bg-white/50"
        }`}
      />
    </button>
  );
}

export default function SettingsScreen() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const { confirmExit } = useDesktopActions();

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
        <div>
          <span className="goal50-text-dim text-[10px] font-bold uppercase tracking-[0.22em]">Control de tu experiencia</span>
          <h1 className="goal50-text mt-1 text-[24px] font-extrabold uppercase leading-none tracking-tight">Configuración</h1>
          <p className="goal50-text-dim mt-1.5 text-[12px]">Ajusta lo esencial de tu cuenta y de cómo usas 11 Cracks.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* ─── Experiencia ─── */}
          <section className="rounded-2xl border p-4 md:p-5" style={CARD_STYLE}>
            <h3 className="goal50-text text-[12px] font-extrabold uppercase tracking-[0.08em]">Experiencia</h3>
            <p className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.1em]">Solo en este dispositivo</p>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border p-3.5" style={CHIP_STYLE}>
              <div className="min-w-0">
                <p className="goal50-text text-[13px] font-bold">Movimiento reducido</p>
                <p className="goal50-text-dim mt-0.5 text-[11px] leading-snug">Limita transiciones y animaciones de la interfaz.</p>
              </div>
              <Switch on={reducedMotion} onToggle={() => setReducedMotion((value) => !value)} />
            </div>
          </section>

          {/* ─── Cuenta ─── */}
          <section className="rounded-2xl border p-4 md:p-5" style={CARD_STYLE}>
            <h3 className="goal50-text text-[12px] font-extrabold uppercase tracking-[0.08em]">Cuenta</h3>
            <p className="goal50-text-dim text-[10px] font-semibold uppercase tracking-[0.1em]">Accesos rápidos</p>

            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("goal50:open-profile"))}
                className="goal50-tile flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition"
              >
                <span className="goal50-text text-[13px] font-bold">Abrir mi perfil</span>
                <span className="goal50-text-dim text-[13px] font-bold">→</span>
              </button>
              <button
                type="button"
                onClick={() => confirmExit()}
                className="flex w-full items-center justify-between rounded-xl border border-[#ff5f57]/25 bg-[#ff5f57]/[0.08] px-3.5 py-2.5 text-left transition hover:border-[#ff5f57]/45 hover:bg-[#ff5f57]/15"
              >
                <span className="flex items-center gap-2 text-[13px] font-bold text-[#ff5f57]">
                  <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
                    <path d="M10 8l-4 4 4 4M6 12h9" />
                  </svg>
                  Cerrar sesión
                </span>
                <span className="text-[13px] font-bold text-[#ff5f57]">→</span>
              </button>
            </div>
          </section>
        </div>

        {/* ─── Privacidad ─── */}
        <section className="rounded-2xl border p-4 md:p-5" style={CARD_STYLE}>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--brand-gold-bright)" }}>
            Privacidad
          </h3>
          <p className="goal50-text-dim mt-2 max-w-2xl text-[13px] leading-relaxed">
            Este entorno demo guarda preferencias locales en tu dispositivo. Tus datos de jugador permanecen dentro del alcance de tu cuenta.
          </p>
        </section>
      </div>
    </div>
  );
}
