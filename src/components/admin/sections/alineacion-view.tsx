"use client";

import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const JUGADORES = [
  { dorsal: 1, nombre: "D. Marín", x: 50, y: 90 },
  { dorsal: 3, nombre: "S. Rojas", x: 20, y: 70 },
  { dorsal: 4, nombre: "T. Gil", x: 50, y: 70 },
  { dorsal: 5, nombre: "N. Peña", x: 80, y: 70 },
  { dorsal: 2, nombre: "J. Esteban", x: 35, y: 55 },
  { dorsal: 8, nombre: "C. Herrera", x: 50, y: 55 },
  { dorsal: 6, nombre: "M. Salas", x: 65, y: 55 },
  { dorsal: 10, nombre: "A. Vera", x: 50, y: 40 },
  { dorsal: 11, nombre: "V. Torres", x: 15, y: 40 },
  { dorsal: 9, nombre: "B. Castro", x: 50, y: 25 },
  { dorsal: 7, nombre: "I. Lozano", x: 85, y: 40 },
];

const MI_DORSAL = 8;

const TITULARES = [
  { dorsal: "01", nombre: "Diego Marín", linea: "POR · Portero" },
  { dorsal: "03", nombre: "Samuel Rojas", linea: "DEF · Defensa" },
  { dorsal: "04", nombre: "Tomás Gil", linea: "DEF · Defensa" },
  { dorsal: "05", nombre: "Nicolás Peña", linea: "DEF · Defensa" },
  { dorsal: "02", nombre: "Juan Esteban", linea: "DEF · Defensa" },
  { dorsal: "08", nombre: "Carlos Herrera", linea: "MID · Mediocentro", mio: true },
  { dorsal: "06", nombre: "Mateo Salas", linea: "MID · Mediocentro" },
  { dorsal: "10", nombre: "Andrés Vera", linea: "MID · Mediocentro" },
  { dorsal: "11", nombre: "Valentina Torres", linea: "FWD · Extremo" },
  { dorsal: "09", nombre: "Bruno Castro", linea: "FWD · Delantero" },
  { dorsal: "07", nombre: "Iván Lozano", linea: "FWD · Extremo" },
];

const SUPLENTES = [
  { dorsal: "12", nombre: "Martín Ospina", linea: "POR · Portero" },
  { dorsal: "14", nombre: "Simón Castaño", linea: "DEF · Defensa" },
  { dorsal: "16", nombre: "Julián Mora", linea: "MID · Mediocentro" },
  { dorsal: "18", nombre: "Emilio Ruiz", linea: "FWD · Delantero" },
];

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6 ${className}`}>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AlineacionView() {
  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="CANCHA · PUBLICACIÓN DEL ENTRENADOR"
        title="Alineación"
        subtitle="Consulta tu lugar en la sesión y llega listo para jugar en equipo."
      />

      {/* ─── Panel 1: Cancha publicada ─── */}
      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[18px] font-extrabold uppercase tracking-tight" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Forjadores Pro <span className="ml-2 text-[#C9A24A]">4-3-3</span>
            </p>
            <p className="mt-0.5 text-[12px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
              Sesión de entrenamiento · Técnica + definición
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
          Esta es la última versión visible para jugadores. Los cambios del entrenador aparecerán aquí cuando se publiquen.
        </p>

        <div className="relative mt-4 overflow-hidden rounded-[16px] border border-emerald-500/20 bg-emerald-950/30" style={{ aspectRatio: "100/65", minHeight: "380px" }}>
          <svg viewBox="0 0 100 65" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <defs>
              <pattern id="grass-player" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="#0a4d1a" />
                <path d="M0 2 L2 0 L4 2 L2 4 Z" fill="#0d5a20" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="65" fill="url(#grass-player)" />
            <line x1="50" y1="0" x2="50" y2="65" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="4 4" />
            <circle cx="50" cy="32.5" r="12" fill="none" stroke="#22c55e" strokeWidth="0.8" />
            <circle cx="50" cy="32.5" r="1.5" fill="#22c55e" />
            <rect x="0" y="16.5" width="20" height="32" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="2" />
            <rect x="80" y="16.5" width="20" height="32" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="2" />
            <rect x="0" y="24.5" width="8" height="16" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="1" />
            <rect x="92" y="24.5" width="8" height="16" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="1" />
            <circle cx="11" cy="32.5" r="1" fill="#22c55e" />
            <circle cx="89" cy="32.5" r="1" fill="#22c55e" />
            <rect x="-1" y="26" width="1.5" height="13" fill="#1a1a1a" stroke="#22c55e" strokeWidth="0.5" />
            <rect x="99.5" y="26" width="1.5" height="13" fill="#1a1a1a" stroke="#22c55e" strokeWidth="0.5" />
          </svg>

          {JUGADORES.map((j) => {
            const mio = j.dorsal === MI_DORSAL;
            return (
              <div
                key={j.dorsal}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                style={{ left: `${j.x}%`, top: `${j.y}%` }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[11px] font-extrabold ${mio ? "border-2 border-[#C9A24A] bg-[#C9A24A]/25 shadow-[0_0_14px_rgba(201,162,74,0.45)]" : "border-2 border-white/40 bg-[#080909]/85"}`} style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                  {j.dorsal}
                </div>
                <span className="whitespace-nowrap rounded border border-white/[0.05] bg-[#080909]/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.05em]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                  {j.nombre}
                </span>
              </div>
            );
          })}

          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[9px] font-medium" style={{ fontFamily: S.barlow, color: "rgba(255,255,255,0.6)" }}>
            <span className="h-2 w-2 rounded-full border-2 border-[#C9A24A] bg-[#C9A24A]/25" /> Tu posición
          </div>
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-[9px] font-medium" style={{ fontFamily: S.barlow, color: "rgba(255,255,255,0.6)" }}>
            <span className="h-2 w-2 rounded-full border-2 border-white/40 bg-[#080909]/85" /> Compañeros
          </div>
        </div>
      </section>

      {/* ─── Paneles 2 y 3 ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Mensaje del entrenador">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Tu foco hoy
          </p>
          <blockquote className="mt-2 text-[14px] font-medium italic leading-relaxed" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
            “Juega simple en el primer toque y activa la espalda del lateral cuando recibas abierto.”
          </blockquote>
          <p className="mt-2 text-[11px] font-medium" style={{ fontFamily: S.barlow, color: "#686862" }}>
            Solo lectura · Carlos Herrera
          </p>
        </Panel>

        <Panel title="Tu posición">
          <div className="flex items-end justify-between gap-4">
            <span style={{ fontFamily: S.barlow, fontWeight: 800, fontSize: "clamp(28px, 3vw, 36px)", lineHeight: 1, color: S.textPrimary }}>
              Mediocentro
            </span>
            <span className="shrink-0 rounded-full border border-[#C9A24A]/30 bg-[#C9A24A]/10 px-3 py-1.5 text-[14px] font-extrabold text-[#E3C065]" style={{ fontFamily: S.barlow }}>
              #8
            </span>
          </div>
          <p className="mt-3 border-t border-white/[0.05] pt-3 text-[12px] font-medium" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
            C. Herrera · <span className="font-bold text-emerald-400">titular</span>
          </p>
        </Panel>
      </div>

      {/* ─── Paneles 4 y 5 ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Titulares">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Titulares
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
              11 jugadores
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {TITULARES.map((t) => (
              <div key={t.dorsal} className={`flex items-center gap-3 rounded-[10px] border p-2.5 ${t.mio ? "border-[#C9A24A]/40 bg-[#C9A24A]/[0.07]" : "border-white/[0.05] bg-white/[0.02]"}`}>
                <span className="w-8 shrink-0 text-center text-[13px] font-extrabold" style={{ fontFamily: S.barlow, color: t.mio ? "#E3C065" : "#686862" }}>
                  {t.dorsal}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                    {t.nombre}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.06em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                    {t.linea}
                  </p>
                </div>
                {t.mio && (
                  <span className="shrink-0 rounded-full border border-[#C9A24A]/40 bg-[#C9A24A]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#E3C065]" style={{ fontFamily: S.barlow }}>
                    Tu posición
                  </span>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Suplentes">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Suplentes
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ fontFamily: S.barlow, color: "#686862" }}>
              4 jugadores
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {SUPLENTES.map((t) => (
              <div key={t.dorsal} className="flex items-center gap-3 rounded-[10px] border border-white/[0.05] bg-white/[0.02] p-2.5">
                <span className="w-8 shrink-0 text-center text-[13px] font-extrabold" style={{ fontFamily: S.barlow, color: "#686862" }}>
                  {t.dorsal}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
                    {t.nombre}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-[0.06em]" style={{ fontFamily: S.barlow, color: S.textSecondary }}>
                    {t.linea}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}