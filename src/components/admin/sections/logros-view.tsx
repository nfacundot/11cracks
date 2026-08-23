"use client";

import type { ReactNode } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

type Estado = "conseguido" | "en progreso" | "próximo";

const ESTILO_ESTADO: Record<Estado, { badge: string; iconBg: string }> = {
  conseguido: {
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    iconBg: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  "en progreso": {
    badge: "border-[#C9A24A]/30 bg-[#C9A24A]/10 text-[#E3C065]",
    iconBg: "border-[#C9A24A]/30 bg-[#C9A24A]/10 text-[#E3C065]",
  },
  próximo: {
    badge: "border-white/10 bg-white/[0.04] text-[#686862]",
    iconBg: "border-white/10 bg-white/[0.04] text-[#686862]",
  },
};

function HitoCard({
  icono,
  categoria,
  nombre,
  desc,
  progreso,
  estado,
}: {
  icono: string;
  categoria: string;
  nombre: string;
  desc: string;
  progreso: string;
  estado: Estado;
}) {
  const estilos = ESTILO_ESTADO[estado];
  return (
    <div className="rounded-[12px] border border-white/[0.05] bg-white/[0.02] p-4">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[16px] font-bold ${estilos.iconBg}`} style={{ fontFamily: S.barlow }}>
          {icono}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            {categoria}
          </p>
          <p className="mt-0.5 truncate text-[14px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            {nombre}
          </p>
          <p className="text-[11px] font-medium leading-snug" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            {desc}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3">
        <span className="text-[15px] font-extrabold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          {progreso}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${estilos.badge}`} style={{ fontFamily: S.barlow }}>
          {estado}
        </span>
      </div>
    </div>
  );
}

function Seccion({ titulo, cantidad, children }: { titulo: string; cantidad: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          {titulo}
        </h3>
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
          {cantidad}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function LogrosView() {
  return (
    <div className="flex flex-col gap-6 pt-12">
      {/* ─── Hero con club/jugador ─── */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <GlobalHero
          eyebrow="HITOS DEL RECORRIDO"
          title="Logros"
          subtitle="Reconoce los avances que construyes dentro y fuera de la cancha."
        />
        <div className="shrink-0 rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 px-6 py-4 text-right">
          <p className="text-[14px] font-extrabold uppercase tracking-tight" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Forjadores Pro
          </p>
          <p className="text-[12px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            Carlos Herrera
          </p>
        </div>
      </div>

      {/* ─── TU COLECCIÓN ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
          Tu colección
        </h3>
        <div className="mt-3 flex items-baseline gap-3">
          <span style={{ fontFamily: S.barlow, fontWeight: 800, fontSize: "clamp(36px, 4vw, 48px)", lineHeight: 1, color: S.textPrimary }}>
            1
          </span>
          <span className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            logros conseguidos hasta hoy
          </span>
        </div>
      </section>

      {/* ─── PRÓXIMO HITO ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
          Próximo hito
        </h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[18px] font-extrabold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Presencia constante
          </p>
          <p className="text-[13px] font-bold text-[#E3C065]" style={{ fontFamily: S.barlow }}>
            18 / 20 · Sesiones asistidas
          </p>
        </div>
      </section>

      {/* ─── DESTACADOS ─── */}
      <Seccion titulo="Destacados" cantidad="1 hito">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HitoCard
            icono="✓"
            categoria="Impacto"
            nombre="Jugador que suma"
            desc="Participación en el ecosistema"
            progreso="1 / 1"
            estado="conseguido"
          />
        </div>
      </Seccion>

      {/* ─── EN PROGRESO ─── */}
      <Seccion titulo="En progreso" cantidad="3 hitos">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HitoCard
            icono="↗"
            categoria="Constancia"
            nombre="Presencia constante"
            desc="Sesiones asistidas"
            progreso="18 / 20"
            estado="en progreso"
          />
          <HitoCard
            icono="↗"
            categoria="Recorrido"
            nombre="Camino de 540 horas"
            desc="Horas validadas"
            progreso="126 / 540"
            estado="en progreso"
          />
          <HitoCard
            icono="↗"
            categoria="Deporte"
            nombre="Ritmo de entrenamiento"
            desc="Días activos del período"
            progreso="4 / 5"
            estado="en progreso"
          />
        </div>
      </Seccion>

      {/* ─── PRÓXIMOS ─── */}
      <Seccion titulo="Próximos" cantidad="1 hito">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HitoCard
            icono="•"
            categoria="NeuroCracks"
            nombre="Primera palabra"
            desc="Objetivos de Bilingüismo Sport"
            progreso="0 / 4"
            estado="próximo"
          />
        </div>
      </Seccion>
    </div>
  );
}