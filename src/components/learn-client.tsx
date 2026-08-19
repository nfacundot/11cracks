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
import { ChevronRightIcon } from "@/components/icons";
import { DashboardClient } from "@/components/dashboard-client";

const INDICATOR_COLORS = [
  { stroke: "#00C8F5", fill: "rgba(0, 200, 245, 0.18)" },
  { stroke: "#C9A24A", fill: "rgba(201, 162, 74, 0.18)" },
  { stroke: "#E06C75", fill: "rgba(224, 108, 117, 0.18)" },
  { stroke: "#98C379", fill: "rgba(152, 195, 121, 0.18)" },
  { stroke: "#D19A66", fill: "rgba(209, 154, 102, 0.18)" },
  { stroke: "#61AFEF", fill: "rgba(97, 175, 239, 0.18)" },
  { stroke: "#C678DD", fill: "rgba(198, 120, 221, 0.18)" },
  { stroke: "#56B6C2", fill: "rgba(86, 182, 194, 0.18)" },
];

type IndicatorCategory = "DEPORTE" | "NEUROCRACKS";

type IndicatorData = {
  id: string;
  name: string;
  category: IndicatorCategory;
  percentage: number;
};

function RadarModal({
  indicator,
  onClose,
}: {
  indicator: IndicatorData;
  onClose: () => void;
}) {
  const data = [
    {
      subject: indicator.name,
      value: indicator.percentage,
      prevValue: Math.max(0, indicator.percentage - 15),
      fullMark: 100,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[14px] border border-[#00C8F5]/20 bg-[#0B0D0D] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wide text-[#F2F0E9]">
            {indicator.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[#686862] transition hover:bg-[#0E1111] hover:text-[#A5A39C]"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <span className="text-[56px] font-bold leading-none text-[#00C8F5]">
            {indicator.percentage}%
          </span>
          <span className="text-xs font-medium text-[#686862]">Periodo actual</span>
        </div>
      </div>
    </div>
  );
}

export function LearnClient({
  userName,
  userUsername,
  avatarUrl,
  userRole,
  indicators,
}: {
  userName: string;
  userUsername: string;
  avatarUrl: string | null;
  userRole: string;
  indicators: IndicatorData[];
}) {
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorData | null>(null);
  const [activeIndicatorId, setActiveIndicatorId] = useState<string | null>(
    indicators.length > 0 ? indicators[0].id : null
  );

  const activeIndicator = indicators.find((i) => i.id === activeIndicatorId) ?? null;

  const sameCategoryIndicators = activeIndicator
    ? indicators.filter((i) => i.category === activeIndicator.category)
    : [];

  const radarData = sameCategoryIndicators.map((ind, idx) => ({
    subject: ind.name,
    value: ind.percentage,
    prevValue: Math.max(0, ind.percentage - 15),
    fullMark: 100,
    color: INDICATOR_COLORS[idx % INDICATOR_COLORS.length].stroke,
  }));

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 md:-mx-8 md:-mt-8">
      {/* ─── Full-page stadium background ─── */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/img/back/backstad.webp)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050606]/70 via-[#050606]/85 to-[#050606]" />
      </div>

      {/* ─── Content ─── */}
      <div className="relative z-10 flex flex-col gap-6 px-4 pt-4 pb-8 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
        {/* Player info — outside the card */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="h-[72px] w-[72px] rounded-full border-2 border-[#C9A24A]/40 object-cover sm:h-[90px] sm:w-[90px]"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-[#C9A24A]/40 bg-[#C9A24A]/10 sm:h-[90px] sm:w-[90px]">
                <span className="text-2xl font-bold text-[#C9A24A] sm:text-3xl">
                  {initials}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-[26px] font-bold uppercase leading-none tracking-wide text-[#F2F0E9] sm:text-[32px] md:text-[40px]">
              {userName}
            </h1>
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#C9A24A] sm:text-sm">
              {userRole}
            </span>
            <span className="text-[10px] font-medium text-[#686862] sm:text-xs">
              Forjadores Pro
            </span>
          </div>
        </div>

        {/* ─── Tu Evolución Panel ─── */}
        <div className="player-evolution rounded-[14px] p-4 sm:p-6 md:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[24px] font-bold uppercase tracking-wide text-[#F2F0E9] sm:text-[28px] md:text-[32px]">
            Tu Evolución
          </h2>

          {/* Segmented control — indicators as tabs */}
          {indicators.length > 0 && (
            <div className="flex flex-wrap gap-1 rounded-lg border border-white/[0.06] bg-[#050606]/80 p-0.5">
              {indicators.map((ind, idx) => {
                const color = INDICATOR_COLORS[idx % INDICATOR_COLORS.length].stroke;
                const isActive = activeIndicatorId === ind.id;
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => setActiveIndicatorId(ind.id)}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition sm:px-3 sm:text-[11px] ${
                      isActive
                        ? "text-[#F2F0E9]"
                        : "text-[#686862] hover:text-[#A5A39C]"
                    }`}
                    style={isActive ? { backgroundColor: `${color}18`, border: `1px solid ${color}40` } : undefined}
                  >
                    {ind.name}{" "}
                    <span style={{ color: isActive ? color : undefined }} className={isActive ? "" : "text-[#686862]/60"}>
                      {ind.percentage}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Radar Chart — shows same-category indicators */}
        {radarData.length >= 3 ? (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid strokeDasharray="3 3" stroke="#68686230" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={({ x, y, payload, index }) => {
                    const color = radarData[index]?.color ?? "#A5A39C";
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={color}
                        fontSize={11}
                        fontWeight={600}
                      >
                        {payload.value}
                      </text>
                    );
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Anterior"
                  dataKey="prevValue"
                  stroke="#686862"
                  strokeDasharray="4 4"
                  fill="transparent"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Radar
                  name="Actual"
                  dataKey="value"
                  stroke="#00C8F5"
                  fill="rgba(0, 200, 245, 0.08)"
                  strokeWidth={2}
                  dot={(props) => {
                    const color = radarData[props.index]?.color ?? "#00C8F5";
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={5}
                        fill={color}
                        stroke={color}
                        strokeWidth={2}
                        strokeOpacity={0.4}
                      />
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="-mt-[220px] mb-[140px] h-2.5 w-2.5 rounded-full bg-[#C9A24A] shadow-[0_0_8px_rgba(201,162,74,0.5)]" />
          </div>
        ) : radarData.length > 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid strokeDasharray="3 3" stroke="#68686230" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={({ x, y, payload, index }) => {
                    const color = radarData[index]?.color ?? "#A5A39C";
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={color}
                        fontSize={11}
                        fontWeight={600}
                      >
                        {payload.value}
                      </text>
                    );
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Anterior"
                  dataKey="prevValue"
                  stroke="#686862"
                  strokeDasharray="4 4"
                  fill="transparent"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Radar
                  name="Actual"
                  dataKey="value"
                  stroke="#00C8F5"
                  fill="rgba(0, 200, 245, 0.08)"
                  strokeWidth={2}
                  dot={(props) => {
                    const color = radarData[props.index]?.color ?? "#00C8F5";
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={5}
                        fill={color}
                        stroke={color}
                        strokeWidth={2}
                        strokeOpacity={0.4}
                      />
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-sm font-medium text-[#686862]">
              Seleccioná un indicador para ver su gráfico
            </span>
          </div>
        )}

        {/* Legend */}
        {radarData.length > 0 && (
          <>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {radarData.map((d, idx) => (
                <div key={`${d.subject}-${idx}`} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: radarData[idx].color }}
                  />
                  <span className="text-[11px] font-medium text-[#A5A39C]">{d.subject}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <span className="h-px w-5 bg-[#686862]" style={{ borderTop: "2px dashed #686862", background: "none", height: 0 }} />
                <span className="text-[10px] text-[#686862]">Periodo anterior</span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#F2F0E9] transition hover:text-[#00C8F5]"
              >
                Ver mi progreso
                <ChevronRightIcon className="h-4 w-4 text-[#00C8F5]" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ─── Dashboard ─── */}
      <DashboardClient />
      </div>

      {selectedIndicator && (
        <RadarModal
          indicator={selectedIndicator}
          onClose={() => setSelectedIndicator(null)}
        />
      )}
    </div>
  );
}
