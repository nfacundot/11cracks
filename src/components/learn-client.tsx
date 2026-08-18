"use client";

import { useState } from "react";

function CircleIndicator({ name, percentage }: { name: string; percentage: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-zinc-200 dark:text-emerald-800"
          />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-green-500 transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-emerald-950 dark:text-white">
          {percentage}%
        </span>
      </div>
      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{name}</span>
    </div>
  );
}

type IndicatorData = {
  id: string;
  name: string;
  percentage: number;
};

export function LearnClient({
  userName,
  userUsername,
  indicators,
}: {
  userName: string;
  userUsername: string;
  indicators: IndicatorData[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-6 dark:border-emerald-900 dark:bg-emerald-950/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-emerald-950 dark:text-white">
              Bienvenido {userName}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              @{userUsername}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl border-2 border-green-200 px-4 py-2.5 text-sm font-black text-green-700 transition hover:bg-green-50 dark:border-emerald-800 dark:text-green-400"
          >
            Indicadores
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-green-100 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-emerald-900 dark:bg-emerald-950/90">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-emerald-950 dark:text-white">Indicadores</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-emerald-900"
              >
                ✕
              </button>
            </div>

            {indicators.length === 0 ? (
              <p className="text-sm font-bold text-zinc-400">No tienes indicadores asignados.</p>
            ) : (
              <div className="grid grid-cols-3 gap-5 max-sm:grid-cols-2">
                {indicators.map((ind) => (
                  <CircleIndicator key={ind.id} name={ind.name} percentage={ind.percentage} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
