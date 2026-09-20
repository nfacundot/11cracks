"use client";

import Link from "next/link";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const AGENDA = [
  { dia: "LUN", fecha: "24 AGO", titulo: "Técnica individual", detalle: "5:30 PM · Cancha principal" },
  { dia: "MAR", fecha: "25 DE AGOSTO", titulo: "Técnica + definición", detalle: "5:30 PM · Cancha principal" },
  { dia: "VIE", fecha: "28 AGO", titulo: "Definición", detalle: "5:30 PM · Cancha principal" },
];

const HISTORIAL = [
  { fecha: "12 AGO", titulo: "Entrenamiento técnico", detalle: "Asististe · 2 h" },
  { fecha: "08 AGO", titulo: "Trabajo táctico", detalle: "Asististe · 2 h" },
];

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6 ${className}`}>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EntrenamientoView() {
  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="PLAYER · OPERACIÓN DEPORTIVA"
        title="Entrenamiento"
        subtitle="Organiza tu semana y llega con claridad a la próxima sesión."
      />

      {/* ─── Panel 1: Próximo entrenamiento ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
          Próximo entrenamiento
        </h3>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[20px] font-extrabold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Técnica + definición
            </p>
            <p className="mt-1 text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
              Cancha principal
            </p>
          </div>
          <div className="text-right">
            <p className="text-[15px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Martes, 25 de agosto
            </p>
            <div className="mt-1 flex items-center justify-end gap-3">
              <span className="text-[13px] font-bold text-[#C9A24A]" style={{ fontFamily: S.barlow }}>
                5:30 PM
              </span>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400" style={{ fontFamily: S.barlow }}>
                Confirmado
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/[0.05] pt-4">
          <span className="text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Forjadores Pro
          </span>
          <span className="text-[12px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Sesión de campo · Cancha principal
          </span>
        </div>
      </section>

      {/* ─── Paneles 2 y 3 ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Seguimiento">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Foco del entrenador
          </p>
          <blockquote className="mt-2 text-[14px] font-medium italic" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            “Trabaja recepción orientada con pierna izquierda.”
          </blockquote>
          <p className="mt-2 text-[11px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Seguimiento técnico · última sesión · 12 ago 2026
          </p>
          <span className="mt-3 inline-block rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            Técnica
          </span>
        </Panel>

        <Panel title="Contenido recomendado">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Para mejorar
          </p>
          <p className="mt-2 text-[18px] font-extrabold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Decisión
          </p>
          <p className="mt-1 text-[12px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            Video recomendado por tu entrenador · 4 min
          </p>
          <span className="mt-3 inline-block rounded-full border border-[#C9A24A]/30 bg-[#C9A24A]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#E3C065]" style={{ fontFamily: S.barlow }}>
            Pendiente
          </span>
        </Panel>
      </div>

      {/* ─── Panel 4: Agenda ─── */}
      <Panel title="Agenda">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[15px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Mi semana
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Sesiones programadas
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {AGENDA.map((s) => (
            <div key={s.titulo} className="flex items-center gap-4 rounded-[12px] border border-white/[0.05] bg-white/[0.02] p-3">
              <div className="w-16 shrink-0 text-center">
                <p className="text-[11px] font-extrabold uppercase text-[#C9A24A]" style={{ fontFamily: S.barlow }}>
                  {s.dia}
                </p>
                <p className="text-[10px] font-bold uppercase" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                  {s.fecha}
                </p>
              </div>
              <div className="min-w-0 flex-1 border-l border-white/[0.06] pl-4">
                <p className="truncate text-[14px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                  {s.titulo}
                </p>
                <p className="text-[11px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                  {s.detalle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ─── Paneles 5 y 6 ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Historial">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Últimas sesiones
          </p>
          <div className="mt-3 space-y-3">
            {HISTORIAL.map((h) => (
              <div key={h.fecha} className="flex items-center gap-4 rounded-[12px] border border-white/[0.05] bg-white/[0.02] p-3">
                <span className="w-14 shrink-0 text-center text-[11px] font-extrabold uppercase" style={{ fontFamily: S.barlow, color: "#686862" }}>
                  {h.fecha}
                </span>
                <div className="min-w-0 flex-1 border-l border-white/[0.06] pl-4">
                  <p className="truncate text-[14px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                    {h.titulo}
                  </p>
                  <p className="text-[11px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                    {h.detalle}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400" style={{ fontFamily: S.barlow }}>
                  Validadas
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Registro">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Horas
          </p>
          <div className="mt-3 space-y-2">
            <Row valor="12 h" etiqueta="realizadas este mes" />
            <Row valor="12 h" etiqueta="validadas este mes" />
            <Row valor="0 h" etiqueta="pendientes" />
          </div>
          <p className="mt-4 border-t border-white/[0.05] pt-4 text-[11px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
            130 h validadas en total · objetivo 540 h.
          </p>
          <Link
            href="/jugador/progress"
            className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C9A24A] hover:underline"
            style={{ fontFamily: S.barlow }}
          >
            Ver mi progreso →
          </Link>
        </Panel>
      </div>
    </div>
  );
}

function Row({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
        {etiqueta}
      </span>
      <span className="text-[18px] font-extrabold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
        {valor}
      </span>
    </div>
  );
}