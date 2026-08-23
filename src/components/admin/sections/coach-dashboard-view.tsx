"use client";

import Link from "next/link";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const PRIORITY = [
  "2 horas requieren validación",
  "6 jugadores requieren seguimiento de asistencia",
  "Alineación publicada",
];

const ACTIONS = [
  { href: "/coach/equipo", label: "Abrir plantel" },
  { href: "/coach/evaluaciones", label: "Evaluar jugador" },
  { href: "/coach/cancha", label: "Abrir cancha" },
];

export function CoachDashboardView() {
  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · Forjadores Pro"
        title="Dashboard"
        subtitle="Lo importante de tu equipo, hoy."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {/* ─── Panel 1: Próximo entrenamiento ─── */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            Próximo entrenamiento
          </h3>
          <div className="mt-4 flex flex-col gap-2">
            <p
              className="text-[16px] font-bold"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              Martes · 5:30 PM
            </p>
            <p
              className="text-[13px] font-medium"
              style={{ fontFamily: S.barlow, color: S.textSecondary }}
            >
              Cancha principal · Técnica + definición
            </p>
            <Link
              href="/coach/asistencia"
              className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C9A24A] hover:underline"
              style={{ fontFamily: S.barlow }}
            >
              Gestionar asistencia →
            </Link>
          </div>
        </section>

        {/* ─── Panel 2: Atención prioritaria ─── */}
        <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
          <h3
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ fontFamily: S.barlow, color: S.textSecondary }}
          >
            Atención prioritaria
          </h3>
          <ul className="mt-4 flex flex-col gap-3">
            {PRIORITY.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-[13px] font-medium"
                style={{ fontFamily: S.barlow, color: S.textSecondary }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: S.gold }}
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ─── Panel 3: Acciones rápidas ─── */}
      <section>
        <h3
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ fontFamily: S.barlow, color: S.textSecondary }}
        >
          Acciones rápidas
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-center gap-2.5 rounded-[12px] border border-[#C9A24A]/20 bg-[#080909] px-4 py-3.5 text-[13px] font-semibold transition hover:border-[#C9A24A]/40 hover:bg-[#0B0D0D]"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}