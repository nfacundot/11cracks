"use client";

import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const NEON_PURPLE = "#B044FF";
const NEON_PURPLE_LIGHT = "#C77DFF";
const CYAN = "#00C1EB";
const WHITE = "#F3F0E8";
const GRAY = "#77746D";
const GRAY_LIGHT = "#AAA69C";
const DARK = "#050505";

export type CharacteristicData = {
  id: string;
  name: string;
  percentage: number;
};

export type IndicatorData = {
  id: string;
  name: string;
  category?: string;
  percentage: number;
};

/* ═══════════ Panel de radar con comparativa Hoy vs Período anterior ═══════════ */
export function RadarEvolucionPanel({
  characteristics,
  indicators,
}: {
  characteristics: CharacteristicData[];
  indicators: IndicatorData[];
}) {
  const [activeCharId, setActiveCharId] = useState<string | null>(
    characteristics.length > 0 ? characteristics[0].id : null
  );
  const [activeIndicatorId, setActiveIndicatorId] = useState<string | null>(null);

  const activeIndicator = activeIndicatorId
    ? indicators.find((ind) => ind.id === activeIndicatorId) ?? null
    : null;

  const radarData = characteristics.map((c) => ({
    subject: c.name,
    value: c.percentage,
    prevValue: Math.max(0, c.percentage - 15),
    fullMark: 100,
    color: NEON_PURPLE,
  }));

  const indicatorRadarData = activeIndicator
    ? [
        {
          subject: activeIndicator.name,
          value: activeIndicator.percentage,
          prevValue: Math.max(0, activeIndicator.percentage - 15),
          fullMark: 100,
          color: CYAN,
        },
      ]
    : [];

  const activeChar = characteristics.find((c) => c.id === activeCharId) ?? characteristics[0] ?? null;
  const activeRadar = activeIndicator
    ? { subject: activeIndicator.name, value: activeIndicator.percentage, prevValue: Math.max(0, activeIndicator.percentage - 15) }
    : activeChar
      ? radarData.find((d) => d.subject === activeChar.name) ?? null
      : null;
  const diff = activeRadar ? activeRadar.value - activeRadar.prevValue : 0;

  const allData = [...radarData, ...indicatorRadarData];

  return (
    <div
      className="relative overflow-hidden rounded-[16px] border border-white/[0.06]"
      style={{ background: DARK }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "url(/img/back/backstad.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${DARK} 0%, ${DARK} 45%, rgba(5,5,5,0.7) 70%, rgba(5,5,5,0.4) 100%)`,
        }}
      />

      <div className="relative z-10 flex flex-col gap-6 p-6 md:flex-row md:items-stretch md:p-8">
        {/* ─── Izquierda: título + indicadores ─── */}
        <div className="flex flex-1 flex-col justify-center gap-4">
          {/* Título */}
          <div className="flex flex-col gap-3">
            <span
              style={{
                fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: CYAN,
              }}
            >
              Visión de rendimiento
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: "clamp(32px, 4vw, 52px)",
                lineHeight: 0.92,
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                color: WHITE,
              }}
            >
              Tu evolución
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif',
                fontWeight: 400,
                fontSize: 15,
                lineHeight: 1.5,
                color: GRAY_LIGHT,
              }}
            >
              Compara tu estado actual con tu período anterior.
            </p>
          </div>

          {indicators.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {indicators.map((ind) => {
                const isActive = activeIndicatorId === ind.id;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => setActiveIndicatorId(isActive ? null : ind.id)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition"
                    style={{
                      cursor: "pointer",
                      border: isActive ? `2px solid ${NEON_PURPLE}` : "1px solid rgba(255,255,255,0.06)",
                      background: isActive ? `${NEON_PURPLE}12` : "transparent",
                      boxShadow: isActive ? `0 0 16px ${NEON_PURPLE}25` : "none",
                    }}
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-full transition"
                      style={{
                        background: isActive ? NEON_PURPLE : GRAY,
                        boxShadow: isActive ? `0 0 8px ${NEON_PURPLE}60` : "none",
                      }}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span
                        className="truncate"
                        style={{
                          fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif',
                          fontWeight: 600,
                          fontSize: 11,
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          color: isActive ? WHITE : GRAY,
                        }}
                      >
                        {ind.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 13, color: isActive ? NEON_PURPLE : GRAY }}>
                        {ind.percentage}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Centro: radar ─── */}
        <div className="flex flex-1 flex-col items-center justify-center">
          {radarData.length >= 3 || indicatorRadarData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={allData} cx="50%" cy="50%" outerRadius="68%">
                  <PolarGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={({ x, y, payload, index }) => {
                      const color = allData[index]?.color ?? GRAY_LIGHT;
                      return (
                        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={11} fontWeight={600} style={{ fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif' }}>
                          {payload.value}
                        </text>
                      );
                    }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Anterior" dataKey="prevValue" stroke={NEON_PURPLE_LIGHT} strokeDasharray="5 5" fill="transparent" strokeWidth={1.5} dot={(props) => <circle cx={props.cx} cy={props.cy} r={3} fill={NEON_PURPLE_LIGHT} strokeOpacity={0.5} />} />
                  <Radar
                    name="Actual"
                    dataKey="value"
                    stroke={NEON_PURPLE}
                    fill={`${NEON_PURPLE}15`}
                    strokeWidth={2.5}
                    dot={(props) => {
                      const color = allData[props.index]?.color ?? NEON_PURPLE;
                      return <circle cx={props.cx} cy={props.cy} r={5} fill={color} stroke={color} strokeWidth={2} strokeOpacity={0.4} />;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: NEON_PURPLE, boxShadow: `0 0 6px ${NEON_PURPLE}60` }} />
                  <span className="text-[11px] font-medium" style={{ color: GRAY_LIGHT }}>Hoy</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-px w-5" style={{ borderTop: `2px dashed ${NEON_PURPLE_LIGHT}`, background: "none", height: 0 }} />
                  <span className="text-[11px] font-medium" style={{ color: GRAY_LIGHT }}>Período anterior</span>
                </div>
                {activeIndicator && (
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CYAN, boxShadow: `0 0 6px ${CYAN}60` }} />
                    <span className="text-[11px] font-medium" style={{ color: GRAY_LIGHT }}>{activeIndicator.name}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-sm font-medium" style={{ color: GRAY }}>
                Seleccioná un indicador para ver su gráfico
              </span>
            </div>
          )}
        </div>

        {/* ─── Derecha: score + características ─── */}
        <div className="flex flex-1 flex-col justify-center gap-4 md:items-end">
          {activeRadar && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 md:min-w-[200px]">
              <span
                style={{
                  fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: GRAY,
                }}
              >
                {activeRadar.subject}
              </span>
              <div className="mt-3 flex items-baseline gap-4">
                <div className="flex flex-col items-center gap-0.5">
                  <span style={{ fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif', fontWeight: 800, fontSize: 48, lineHeight: 1, color: WHITE }}>
                    {activeRadar.value}
                  </span>
                  <span style={{ fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: GRAY }}>
                    ACTUAL
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span style={{ fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 32, lineHeight: 1, color: GRAY }}>
                    {activeRadar.prevValue}
                  </span>
                  <span style={{ fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: GRAY }}>
                    ANTERIOR
                  </span>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <span style={{ fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 14, color: diff >= 0 ? NEON_PURPLE : "#E06C75", textShadow: diff >= 0 ? `0 0 10px ${NEON_PURPLE}50` : "none" }}>
                  {diff >= 0 ? `+${diff}` : diff} pts
                </span>
              </div>
            </div>
          )}

          {characteristics.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
              {characteristics.map((c) => {
                const isActive = activeCharId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCharId(c.id)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition"
                    style={{
                      cursor: "pointer",
                      border: isActive ? `2px solid ${NEON_PURPLE}` : "1px solid rgba(255,255,255,0.06)",
                      background: isActive ? `${NEON_PURPLE}12` : "transparent",
                      boxShadow: isActive ? `0 0 16px ${NEON_PURPLE}25` : "none",
                    }}
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-full transition"
                      style={{
                        background: isActive ? NEON_PURPLE : GRAY,
                        boxShadow: isActive ? `0 0 8px ${NEON_PURPLE}60` : "none",
                      }}
                    />
                    <span
                      className="min-w-0 truncate"
                      style={{
                        fontFamily: 'var(--font-barlow), "Barlow Condensed", sans-serif',
                        fontWeight: 600,
                        fontSize: 11,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: isActive ? WHITE : GRAY,
                      }}
                    >
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}