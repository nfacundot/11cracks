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

type IndicatorData = {
  id: string;
  name: string;
  percentage: number;
};

function RadarModal({
  indicator,
  indicators,
  onClose,
}: {
  indicator: IndicatorData;
  indicators: IndicatorData[];
  onClose: () => void;
}) {
  const data = indicators.map((ind) => ({
    subject: ind.name,
    value: ind.percentage,
    fullMark: 100,
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-green-100 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-emerald-900 dark:bg-emerald-950/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-emerald-950 dark:text-white">
            {indicator.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-emerald-900"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#71717a", fontSize: 11, fontWeight: 700 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#a1a1aa", fontSize: 10 }}
              />
              <Radar
                name="Indicador"
                dataKey="value"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 text-center">
          <span className="text-3xl font-black text-green-500">
            {indicator.percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

function AvatarCircle({
  src,
  name,
  size = "sm",
}: {
  src: string | null;
  name: string;
  size?: "sm" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const dim = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const textSize = size === "lg" ? "text-sm" : "text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-white/20`}
      />
    );
  }

  return (
    <div
      className={`${dim} ${textSize} flex shrink-0 items-center justify-center rounded-full bg-green-600 font-black text-white ring-2 ring-white/20`}
    >
      {initials}
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

  return (
    <div className="flex flex-col gap-5">
      <div className="player-card rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <AvatarCircle src={avatarUrl} name={userName} size="lg" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-black text-emerald-950 dark:text-white">
              {userName}
            </span>
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              {userRole}
            </span>
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
              @{userUsername}
            </span>
          </div>
        </div>
      </div>

      <div className="player-evolution rounded-2xl p-6">
        <h2 className="mb-4 text-lg font-black text-white">Tu Evolución</h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {indicators.map((ind) => (
            <button
              key={ind.id}
              type="button"
              onClick={() => setSelectedIndicator(ind)}
              className="flex flex-col items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm p-4 transition hover:bg-white/25 active:scale-95"
            >
              <div className="relative h-16 w-16">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    fill="none"
                    stroke="#8cb62e"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={
                      2 * Math.PI * 34 - (ind.percentage / 100) * 2 * Math.PI * 34
                    }
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white">
                  {ind.percentage}%
                </span>
              </div>
              <span className="text-xs font-bold text-white/80">{ind.name}</span>
              <span className="text-[10px] font-bold text-white/50">Ver gráfico</span>
            </button>
          ))}
        </div>
      </div>

      {selectedIndicator && (
        <RadarModal
          indicator={selectedIndicator}
          indicators={indicators}
          onClose={() => setSelectedIndicator(null)}
        />
      )}
    </div>
  );
}
