"use client";

import Link from "next/link";
import { IconSearch } from "../icons";
import { PcRail } from "./pc-rail";

/* ---------- sidebar ---------- */

/* ---------- KPI cards ---------- */

const KPIS = [
  {
    label: "Ingresos totales",
    value: "$734,612",
    delta: "+11.2%",
    up: true,
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 17l5.5-6 4 4L20 7M20 7h-4.5M20 7v4.5" /></svg>
    ),
    pill: "bg-[#a3e635]",
    dark: false,
  },
  {
    label: "Usuarios activos",
    value: "682,014",
    delta: "+3.1%",
    up: true,
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c1.2-3 3.3-4.4 5.5-4.4s4.3 1.4 5.5 4.4M16 5.4a3.2 3.2 0 0 1 0 6.2M20.5 19.5c-.8-2-2.1-3.3-3.6-3.9" /></svg>
    ),
    pill: "bg-[#fb7185]",
    dark: true,
  },
  {
    label: "Apuestas realizadas",
    value: "1,286,754",
    delta: "+6.4%",
    up: true,
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M4 4h16l-1.5 5L20 14v6H4v-6l1.5-5L4 4Z" /></svg>
    ),
    pill: "bg-[#5eead4] text-black",
    dark: false,
  },
  {
    label: "Tasa de conversión",
    value: "4.60%",
    delta: "-2.1%",
    up: false,
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7l5.5 6 4-4L20 17M20 17h-4.5M20 17v-4.5" /></svg>
    ),
    pill: "bg-[#f472b6]",
    dark: false,
  },
];

/* ---------- revenue chart ---------- */

const REVENUE_LINE =
  "0,58 14,56 28,50 42,52 56,42 70,44 84,34 98,36 112,26 126,28 140,16 154,20 168,10 182,12 196,4 210,6";
const FORECAST_LINE =
  "0,58 20,55 40,48 60,50 80,40 100,42 120,30 140,32 160,20 180,22 200,12 210,10";
const BARS = [26, 38, 30, 46, 40, 54, 48, 62];

function RevenueChart() {
  return (
    <section className="min-w-0 flex-1 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[21px] font-semibold text-[#141c10]">Dinámica de ingresos</h3>
        <div className="flex items-center gap-5 text-[12px] text-[#4c564a]">
          <span className="flex items-center gap-2">
            <span className="h-[3px] w-5 rounded-full bg-[#3f8f4e]" /> Periodo anterior
          </span>
          <span className="flex items-center gap-2">
            <span className="h-0 w-5 border-t-2 border-dashed border-[#c0cab8]" /> Previsión
          </span>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <div className="flex h-[210px] flex-col justify-between py-1 text-right text-[11px] text-[#8a9284]">
          <span>$900k</span><span>$795k</span><span>$690k</span><span>$585k</span><span>$480k</span>
        </div>
        <div className="relative min-w-0 flex-1">
          {/* gridlines */}
          {[0, 25, 50, 75, 100].map((x) => (
            <span key={x} className="absolute inset-y-0 w-px bg-[#edf1e8]" style={{ left: `${x}%` }} />
          ))}
          <svg viewBox="0 0 210 70" preserveAspectRatio="none" className="relative block h-[190px] w-full">
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3f8f4e" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#3f8f4e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={`${REVENUE_LINE} 210,70 0,70`} fill="url(#revFill)" />
            <polyline points={FORECAST_LINE} fill="none" stroke="#c0cab8" strokeWidth="1.6" strokeDasharray="5 5" />
            <polyline points={REVENUE_LINE} fill="none" stroke="#3f8f4e" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="168" cy="10" r="4" fill="#3f8f4e" stroke="#fff" strokeWidth="2" />
          </svg>
          {/* peak marker */}
          <div className="pointer-events-none absolute left-[68%] top-0 flex -translate-x-1/2 flex-col items-center">
            <span className="rounded-full bg-[#141c10] px-3.5 py-1.5 text-[13px] font-semibold text-white">$860k</span>
            <span className="mt-1 h-10 w-px bg-[#141c10]/30" />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-[#8a9284]">
            {["Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Des"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- right side cards ---------- */

function TopSportCard() {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
      <div className="flex items-center justify-between">
        <h4 className="text-[16px] font-semibold text-[#141c10]">Deporte top</h4>
        <span className="text-[12px] font-semibold text-[#0e7a4e]">+34.2%</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#141c10] text-[20px]">⚽</span>
        <div>
          <p className="text-[22px] font-bold leading-tight text-[#141c10]">$128,045</p>
          <p className="text-[11px] text-[#8a9284]">Ingresos del deporte top</p>
        </div>
        <div className="ml-auto flex h-10 items-end gap-1.5">
          {BARS.map((h, i) => (
            <span
              key={i}
              className={`w-2.5 rounded-sm ${i === 3 ? "bg-[#a3e635]" : "bg-[#d8e0d0]"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TopPlayersCard() {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
      <div className="flex items-center justify-between">
        <h4 className="text-[16px] font-semibold text-[#141c10]">Jugadores top</h4>
        <span className="text-[12px] font-semibold text-[#0e7a4e]">+42.2%</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex -space-x-3">
          {[
            "from-orange-300 to-rose-500",
            "from-sky-400 to-indigo-500",
            "from-amber-300 to-orange-500",
            "from-emerald-300 to-teal-500",
          ].map((g) => (
            <span key={g} className={`size-10 rounded-full bg-gradient-to-br ring-[3px] ring-white ${g}`} />
          ))}
        </div>
        <div>
          <p className="text-[22px] font-bold leading-tight text-[#141c10]">$2,400</p>
          <p className="text-[11px] text-[#8a9284]">Top 100 jugadores</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- root ---------- */

export default function AnalyticsScreen() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#111310]">
      <PcRail active="analitica" />
      <main className="no-scrollbar relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-gradient-to-br from-[#e3eee0] via-[#e9f2e4] to-[#eef4ea] max-md:pb-20">
        {/* top bar */}
        <div className="flex flex-wrap items-center gap-3 px-7 pt-6">
          <button type="button" className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 text-[13px] font-semibold text-[#141c10] shadow-sm">
            <svg viewBox="0 0 24 24" className="size-4 text-[#5c665a]" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.5" y="5" width="17" height="16" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
            1 sept 2024 - 30 sept 2024
            <svg viewBox="0 0 24 24" className="size-4 text-[#5c665a]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <label className="flex h-11 min-w-[200px] flex-1 items-center gap-2.5 rounded-2xl bg-white/80 px-4 shadow-sm sm:max-w-[300px]">
            <IconSearch className="size-4 text-[#5c665a]" />
            <input placeholder="Buscar" className="w-full bg-transparent text-[13px] text-[#141c10] placeholder:text-[#a5b09e] outline-none" />
          </label>
          <div className="ml-auto flex items-center gap-4">
            <button type="button" aria-label="Notificaciones" data-tip="Notificaciones (3)" className="relative text-[#4c564a] transition hover:text-[#141c10]">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M18 15v-4.5a6 6 0 1 0-12 0V15l-1.8 2.6h15.6L18 15Z" /><path d="M10 20.6a2.2 2.2 0 0 0 4 0" /></svg>
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#e05a3a] text-[9px] font-bold text-white">3</span>
            </button>
            <span className="size-10 rounded-full bg-gradient-to-br from-orange-300 via-rose-400 to-rose-600" />
            <Link
              href="/"
              className="rounded-full bg-[#141c10] px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-black"
            >
              ← Contratos
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 gap-4 px-7 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className={`rounded-3xl p-5 shadow-[0_1px_2px_rgba(20,30,10,0.06)] ${
                k.dark ? "bg-[#141c10] text-white" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex size-10 items-center justify-center rounded-xl ${k.pill} ${k.dark ? "text-white" : "text-white"}`}>
                  {k.icon}
                </span>
                <span
                  className={`flex items-center gap-1 text-[12px] font-semibold ${
                    k.dark
                      ? k.up ? "text-lime" : "text-[#fb7185]"
                      : k.up ? "text-[#0e7a4e]" : "text-[#c0392b]"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className={`size-3.5 ${k.up ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 19V5m0 0-5 5m5-5 5 5" /></svg>
                  {k.delta}
                </span>
              </div>
              <p className={`mt-4 text-[13px] ${k.dark ? "text-white/55" : "text-[#8a9284]"}`}>{k.label}</p>
              <p className="mt-1 text-[26px] font-bold tracking-tight">{k.value}</p>
            </div>
          ))}
        </div>

        {/* chart + side cards */}
        <div className="grid flex-1 grid-cols-1 gap-4 p-7 xl:grid-cols-[1fr_320px]">
          <RevenueChart />
          <div className="flex flex-col gap-4">
            <TopSportCard />
            <TopPlayersCard />
          </div>
        </div>
      </main>
    </div>
  );
}
