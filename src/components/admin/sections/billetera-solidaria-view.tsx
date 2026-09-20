"use client";

import Link from "next/link";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";
import { StarIcon } from "@/components/icons";

const FUENTES = [
  { n: "01", nombre: "Eventos" },
  { n: "02", nombre: "Promoción de talento" },
  { n: "03", nombre: "Cuidado del planeta" },
  { n: "04", nombre: "Dotación de uniformes" },
  { n: "05", nombre: "Plan Padrino" },
];

const IMPACTO_CLUB = [
  { valor: "24", etiqueta: "Jugadores apoyados", detalle: "en el programa demo" },
  { valor: "48", etiqueta: "Uniformes entregados", detalle: "último ciclo" },
  { valor: "320", etiqueta: "Botellas recicladas", detalle: "aporte del club" },
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

export function BilleteraSolidariaView() {
  return (
    <div className="flex flex-col gap-6 pt-12">
      {/* ─── Hero con club/jugador ─── */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <GlobalHero
          eyebrow="IMPACTO Y APOYO"
          title="Billetera Solidaria"
          subtitle="Entiende qué apoyo existe para ti y qué hace posible el ecosistema."
        />
        <div className="shrink-0 rounded-[14px] border border-[#C9A24A]/10 tk-panel px-6 py-4 text-right">
          <p className="text-[14px] font-extrabold uppercase tracking-tight" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            Forjadores Pro
          </p>
          <p className="text-[12px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            Carlos Herrera
          </p>
        </div>
      </div>

      {/* ─── Apoyo disponible (panel completo) ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
              Apoyo disponible
            </h3>
            <p className="mt-2" style={{ fontFamily: S.barlow, fontWeight: 800, fontSize: "clamp(40px, 5vw, 56px)", lineHeight: 1, color: S.textPrimary }}>
              $120.000
            </p>
            <p className="mt-3 max-w-xl text-[12px] font-medium leading-relaxed" style={{ fontFamily: S.barlow, color: "#686862" }}>
              Disponible para beneficios y apoyos aprobados dentro del programa; no es efectivo de libre retiro.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#C9A24A]/40 bg-[#C9A24A]/10 text-[#E3C065]">
              <StarIcon className="h-7 w-7" />
            </span>
            <span className="max-w-[110px] text-[11px] font-bold uppercase leading-tight tracking-[0.12em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
              Apoyo con propósito
            </span>
          </div>
        </div>
      </section>

      {/* ─── De dónde viene + Qué ha hecho posible ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="De dónde viene">
          <p className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            Trazabilidad simple
          </p>
          <div className="mt-4 space-y-2.5">
            {FUENTES.map((f) => (
              <div key={f.n} className="flex items-center gap-3 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <span className="w-8 shrink-0 text-center text-[12px] font-extrabold text-[#E3C065]" style={{ fontFamily: S.barlow }}>
                  {f.n}
                </span>
                <span className="border-l border-white/[0.06] pl-3 text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                  {f.nombre}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Qué ha hecho posible">
          <p className="text-[13px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            Impacto del club
          </p>
          <div className="mt-4 space-y-2.5">
            {IMPACTO_CLUB.map((i) => (
              <div key={i.etiqueta} className="flex items-center gap-4 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <span className="shrink-0 text-right" style={{ fontFamily: S.barlow, fontWeight: 800, fontSize: 26, lineHeight: 1, color: "#E3C065" }}>
                  {i.valor}
                </span>
                <div className="min-w-0 border-l border-white/[0.06] pl-3">
                  <p className="truncate text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                    {i.etiqueta}
                  </p>
                  <p className="text-[11px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                    {i.detalle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ─── MI IMPACTO ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 tk-panel p-5 md:p-6">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
          Mi impacto
        </h3>
        <p className="mt-3 max-w-2xl text-[14px] font-medium leading-relaxed" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
          Tu asistencia, tu cuidado del material y tu compromiso con el programa también hacen crecer este ecosistema.
        </p>
        <Link
          href="/jugador/logros"
          className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#C9A24A] hover:underline"
          style={{ fontFamily: S.barlow }}
        >
          Ver mis logros →
        </Link>
      </section>
    </div>
  );
}