"use client";

import { Avatar } from "./dashboard-screen";

type P = { name: string; pos: string; top: string; left: string; dot?: boolean; card?: boolean; i: number };

const PLAYERS: P[] = [
  { name: "M. Guiu", pos: "ST", top: "9%", left: "40%", i: 2 },
  { name: "N. Jackson", pos: "ST", top: "9%", left: "74%", dot: true, i: 3 },
  { name: "C. Nkunku", pos: "CAM", top: "27%", left: "50%", i: 5 },
  { name: "E. Fernández", pos: "CM", top: "45%", left: "28%", i: 6 },
  { name: "C. Casadei", pos: "CM", top: "45%", left: "72%", i: 8 },
  { name: "M. Caicedo", pos: "CDM", top: "61%", left: "50%", i: 7 },
  { name: "M. Cucurella", pos: "LB", top: "80%", left: "10%", i: 4 },
  { name: "A. Disasi", pos: "CB", top: "80%", left: "31%", card: true, i: 9 },
  { name: "B. Badiashile", pos: "CB", top: "80%", left: "63%", i: 10 },
  { name: "R. Jamess", pos: "RB", top: "80%", left: "90%", i: 11 },
  { name: "R. Sánchez", pos: "GK", top: "95%", left: "50%", i: 1 },
];

export default function LineupScreen() {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background:
          "repeating-linear-gradient(90deg, #bfe3b4 0 56px, #b2dca6 56px 112px)",
      }}
    >
      {/* líneas del campo (proporción vertical correcta) */}
      <svg viewBox="0 0 100 150" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <g fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.35">
          {/* límites */}
          <rect x="3" y="3" width="94" height="144" />
          {/* medio campo */}
          <line x1="3" y1="75" x2="97" y2="75" />
          <circle cx="50" cy="75" r="13" />
          <circle cx="50" cy="75" r="0.8" fill="rgba(255,255,255,0.8)" stroke="none" />
          {/* área superior */}
          <rect x="24" y="3" width="52" height="18" />
          <rect x="37" y="3" width="26" height="7" />
          <path d="M40 21 A 11 11 0 0 0 60 21" />
          {/* área inferior */}
          <rect x="24" y="129" width="52" height="18" />
          <rect x="37" y="140" width="26" height="7" />
          <path d="M40 129 A 11 11 0 0 1 60 129" />
          {/* porterías */}
          <rect x="42" y="0.8" width="16" height="2.2" />
          <rect x="42" y="147" width="16" height="2.2" />
        </g>
      </svg>

      {PLAYERS.map((pl) => (
        <div
          key={pl.name}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ top: pl.top, left: pl.left }}
        >
          {pl.card ? (
            /* tarjeta especial girada */
            <div className="relative -rotate-6">
              <div className="flex h-[92px] w-[74px] flex-col items-center justify-center rounded-xl bg-[#141414] shadow-[0_10px_24px_rgba(0,0,0,0.35)] ring-1 ring-black/40">
                <Avatar i={pl.i} size={44} />
                <p className="mt-1.5 text-[11px] font-semibold text-white">{pl.name}</p>
                <p className="text-[10px] text-white/50">{pl.pos}</p>
              </div>
              <div className="absolute -inset-1 -z-10 -rotate-3 rounded-xl border-2 border-dashed border-white/70" />
            </div>
          ) : (
            <div className="relative">
              <span className="block size-11 rounded-full bg-white p-[2.5px] shadow-md">
                <Avatar i={pl.i} size={39} />
              </span>
              {pl.dot ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#e05a3a] text-[8px] font-bold text-white ring-2 ring-white">
                  ⚑
                </span>
              ) : null}
              <p className="mt-1 text-center text-[11px] font-semibold leading-tight text-[#1c2b18]">
                {pl.name}
              </p>
              <p className="text-center text-[10px] leading-tight text-[#4c6a45]">{pl.pos}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
