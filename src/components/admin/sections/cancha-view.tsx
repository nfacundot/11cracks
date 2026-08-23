"use client";

import { useState } from "react";
import { GlobalHero, globalStyles as S } from "@/components/admin/global-hero";

const JUGADORES = [
  { dorsal: 1, nombre: "D. Marín", nombreCompleto: "Diego Marín", pos: "Portero" },
  { dorsal: 3, nombre: "S. Rojas", nombreCompleto: "Samuel Rojas", pos: "Defensa" },
  { dorsal: 4, nombre: "T. Gil", nombreCompleto: "Tomás Gil", pos: "Defensa" },
  { dorsal: 5, nombre: "N. Peña", nombreCompleto: "Nicolás Peña", pos: "Defensa" },
  { dorsal: 2, nombre: "J. Esteban", nombreCompleto: "Juan Esteban", pos: "Defensa" },
  { dorsal: 8, nombre: "C. Herrera", nombreCompleto: "Carlos Herrera", pos: "Mediocentro" },
  { dorsal: 6, nombre: "M. Salas", nombreCompleto: "Mateo Salas", pos: "Mediocentro" },
  { dorsal: 10, nombre: "A. Vera", nombreCompleto: "Andrés Vera", pos: "Mediocentro" },
  { dorsal: 11, nombre: "V. Torres", nombreCompleto: "Valentina Torres", pos: "Extremo" },
  { dorsal: 9, nombre: "B. Castro", nombreCompleto: "Bruno Castro", pos: "Delantero" },
  { dorsal: 7, nombre: "I. Lozano", nombreCompleto: "Iván Lozano", pos: "Extremo" },
];

// Posiciones iniciales en la cancha (porcentajes: x=izq-der, y=arriba-abajo)
const POSICIONES_INICIALES: Record<number, { x: number; y: number }> = {
  1: { x: 50, y: 90 },   // Portería propia
  3: { x: 20, y: 70 },   // Defensa izq
  4: { x: 50, y: 70 },   // Defensa central
  5: { x: 80, y: 70 },   // Defensa der
  2: { x: 35, y: 55 },   // Lateral izq
  8: { x: 50, y: 55 },   // Mediocentro
  6: { x: 65, y: 55 },   // Lateral der
  10: { x: 50, y: 40 },  // Mediapunta
  11: { x: 15, y: 40 },  // Extremo izq
  9: { x: 50, y: 25 },   // Delantero centro
  7: { x: 85, y: 40 },   // Extremo der
};

export function CanchaView() {
  const [formacion, setFormacion] = useState("4-3-3");
  const [posiciones, setPosiciones] = useState<Record<number, { x: number; y: number }>>(POSICIONES_INICIALES);
  const [jugadorArrastrando, setJugadorArrastrando] = useState<number | null>(null);

  const handleMouseDown = (dorsal: number) => {
    setJugadorArrastrando(dorsal);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!jugadorArrastrando) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosiciones((prev) => ({ ...prev, [jugadorArrastrando]: { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } }));
  };

  const handleMouseUp = () => setJugadorArrastrando(null);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!jugadorArrastrando) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setPosiciones((prev) => ({ ...prev, [jugadorArrastrando]: { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) } }));
  };

  const handleTouchEnd = () => setJugadorArrastrando(null);

  return (
    <div className="flex flex-col gap-6 pt-12">
      <GlobalHero
        eyebrow="COACH · FIELD BOARD"
        title="Alineación"
        subtitle="Organiza tu equipo y publica la formación."
      />

      <section className="rounded-[14px] border border-[#C9A24A]/10 bg-[#080909]/85 p-5 md:p-6">
        {/* ─── Header del panel ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#E3C065] bg-[#C9A24A]/10 px-2.5 py-1 rounded-full" style={{ fontFamily: S.barlow }}>
              Borrador
            </span>
            <select
              value={formacion}
              onChange={(e) => setFormacion(e.target.value)}
              className="rounded-[8px] border border-white/10 bg-[#080909] px-3 py-1.5 text-[13px] outline-none transition hover:border-[#C9A24A]/30 focus:border-[#C9A24A]/60"
              style={{ fontFamily: S.barlow, color: S.textPrimary }}
            >
              <option value="4-3-3">4-3-3</option>
              <option value="4-4-2">4-4-2</option>
              <option value="3-5-2">3-5-2</option>
              <option value="4-5-1">4-5-1</option>
            </select>
          </div>
          <p className="text-[12px] text-[#686862]" style={{ fontFamily: S.barlow }}>
            El borrador solo lo ve el Coach. Publica para actualizar la Alineación del Player.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#686862] shrink-0" style={{ fontFamily: S.barlow }}>Formación</span>
            <span className="text-[16px] font-bold text-[#C9A24A]" style={{ fontFamily: S.barlow }}>{formacion}</span>
            <button className="ml-auto rounded-[10px] border border-[#C9A24A]/40 bg-[#C9A24A]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:bg-[#C9A24A]/20 hover:border-[#C9A24A]/60" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Publicar para el equipo
            </button>
            <button className="rounded-[10px] border border-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition hover:border-white/20 hover:bg-white/[0.03]" style={{ fontFamily: S.barlow, color: S.textPrimary }}>
              Guardar alineación
            </button>
          </div>
        </div>

        {/* ─── Cancha de fútbol ─── */}
        <div
          className="relative rounded-[16px] overflow-hidden bg-emerald-950/30 border border-emerald-500/20"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ aspectRatio: "100/65", minHeight: "420px" }}
        >
          {/* Fondo cancha */}
          <svg viewBox="0 0 100 65" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="grass" patternUnits="userSpaceOnUse" width="4" height="4">
                <rect width="4" height="4" fill="#0a4d1a" />
                <path d="M0 2 L2 0 L4 2 L2 4 Z" fill="#0d5a20" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="65" fill="url(#grass)" />
            
            {/* Línea central */}
            <line x1="50" y1="0" x2="50" y2="65" stroke="#22c55e" strokeWidth="0.8" strokeDasharray="4 4" />
            <circle cx="50" cy="32.5" r="12" fill="none" stroke="#22c55e" strokeWidth="0.8" />
            <circle cx="50" cy="32.5" r="1.5" fill="#22c55e" />
            
            {/* Áreas grandes */}
            <rect x="0" y="16.5" width="20" height="32" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="2" />
            <rect x="80" y="16.5" width="20" height="32" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="2" />
            
            {/* Áreas pequeñas */}
            <rect x="0" y="24.5" width="8" height="16" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="1" />
            <rect x="92" y="24.5" width="8" height="16" fill="none" stroke="#22c55e" strokeWidth="0.8" rx="1" />
            
            {/* Puntos de penalti */}
            <circle cx="11" cy="32.5" r="1" fill="#22c55e" />
            <circle cx="89" cy="32.5" r="1" fill="#22c55e" />
            
            {/* Arcos */}
            <rect x="-1" y="26" width="1.5" height="13" fill="#1a1a1a" stroke="#22c55e" strokeWidth="0.5" />
            <rect x="99.5" y="26" width="1.5" height="13" fill="#1a1a1a" stroke="#22c55e" strokeWidth="0.5" />
          </svg>

          {/* Jugadores draggable */}
          {JUGADORES.map((j) => {
            const pos = posiciones[j.dorsal] || { x: 50, y: 50 };
            return (
              <button
                key={j.dorsal}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleMouseDown(j.dorsal); }}
                onTouchStart={(e) => { e.preventDefault(); handleMouseDown(j.dorsal); }}
                className="absolute touch-none"
                style={{
                  left: `calc(${pos.x}% - 24px)`,
                  top: `calc(${pos.y}% - 24px)`,
                  zIndex: jugadorArrastrando === j.dorsal ? 50 : 10,
                  transition: jugadorArrastrando === j.dorsal ? "none" : "left 0.1s, top 0.1s",
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 w-10 h-10 rounded-full bg-[#080909] border-2 border-[#C9A24A]/60 flex items-center justify-center text-[11px] font-extrabold" style={{ color: S.textPrimary }}>
                      {j.dorsal}
                    </div>
                    {jugadorArrastrando === j.dorsal && (
                      <div className="absolute -inset-1 rounded-full border-2 border-[#C9A24A] animate-pulse bg-[#C9A24A]/10" />
                    )}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.05em] whitespace-nowrap bg-[#080909]/90 px-1.5 py-0.5 rounded border border-white/[0.05]" style={{ color: S.textPrimary }}>
                    {j.nombre}
                  </span>
                </div>
              </button>
            );
          })}
          
          {/* Leyendas */}
          <div className="absolute bottom-2 left-2 text-[9px] font-medium text-white/60" style={{ fontFamily: S.barlow }}>
            Tu posición
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] font-medium text-white/60" style={{ fontFamily: S.barlow }}>
            Compañeros
          </div>
        </div>

        {/* ─── Lista de jugadores para referencia ─── */}
        <div className="mt-6 pt-4 border-t border-white/[0.05]">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#686862] mb-3" style={{ fontFamily: S.barlow }}>Jugadores del plantel</h4>
          <div className="flex flex-wrap gap-2">
            {JUGADORES.map((j) => (
              <span
                key={j.dorsal}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 text-[11px] font-medium"
                style={{ fontFamily: S.barlow, color: S.textSecondary }}
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/[0.05] text-[10px] font-extrabold" style={{ color: S.textPrimary }}>
                  {j.dorsal}
                </span>
                {j.nombreCompleto} · {j.pos}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}