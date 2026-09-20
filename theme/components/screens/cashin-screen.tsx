"use client";

import { Avatar } from "./dashboard-screen";
import { Spark } from "./transfers-screen";

const ROWS = [
  { name: "R. Lavia", club: "SOU", i: 8, type: "Appearance", date: "18 Aug", amount: "110M €" },
  { name: "D. Washington", club: "SAN", i: 5, type: "Goal Bonus", date: "24 Aug", amount: "98M €" },
  { name: "M. Caicedo", club: "BHA", i: 6, type: "Loyalty Bonus", date: "14 Aug", amount: "89M €" },
  { name: "C. Palmer", club: "MNC", i: 2, type: "Goal Bonus", date: "1 Sep", amount: "116M €" },
];

const WAVE = "0,30 20,22 40,26 60,16 80,24 100,14 120,22 140,12 160,26 180,20 200,32 220,26 240,38 260,30 280,40";

export default function CashinScreen() {
  return (
    <div className="flex h-full w-full flex-col gap-5 overflow-y-auto bg-[#f0f1ea] p-5">
      {/* tarjeta Cash In */}
      <section className="rounded-3xl bg-[#e4f2df] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-[#141c10]">Cash In</h2>
          <p className="text-[13px] text-[#6d7a68]">
            Sum <span className="font-semibold text-[#141c10]">1,985,690,534 €</span>
          </p>
        </div>

        <div className="mt-3 grid grid-cols-[1.4fr_0.9fr_1.1fr_0.8fr_0.8fr] gap-x-3 text-[11px] text-[#8a9284]">
          <span>Player</span><span>From</span><span>Type of Bonus</span><span>Date</span><span className="text-right">Amount</span>
        </div>
        <ul className="mt-1.5 space-y-1">
          {ROWS.map((r, idx) => (
            <li
              key={`${r.name}-${idx}`}
              className="grid grid-cols-[1.4fr_0.9fr_1.1fr_0.8fr_0.8fr] items-center gap-x-3 rounded-xl px-1 py-2 transition hover:bg-white/60"
            >
              <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[#141c10]">
                <Avatar i={r.i} size={28} />
                <span className="truncate">{r.name}</span>
              </span>
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#4c564a]">
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-[8px] font-bold">{r.club.slice(0, 2)}</span>
                {r.club}
              </span>
              <span className="truncate text-[12px] text-[#4c564a]">{r.type}</span>
              <span className="text-[12px] text-[#4c564a]">{r.date}</span>
              <span className="text-right text-[13px] font-semibold text-[#141c10]">{r.amount}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* gráfico de evolución */}
      <section className="rounded-3xl bg-white p-5">
        <div className="flex gap-3">
          <div className="flex h-[130px] flex-col justify-between text-right text-[10px] text-[#8a9284]">
            <span>120M</span><span>115M</span><span>110M</span><span>105M</span><span>100M</span>
          </div>
          <div className="relative min-w-0 flex-1">
            {[0, 25, 50, 75, 100].map((x) => (
              <span key={x} className="absolute inset-y-0 w-px bg-[#edf1e8]" style={{ left: `${x}%` }} />
            ))}
            <svg viewBox="0 0 280 45" preserveAspectRatio="none" className="block h-[130px] w-full">
              <polyline points={WAVE} fill="none" stroke="#1d5c50" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="mt-2 flex justify-between pl-10 text-[10px] text-[#8a9284]">
          {["15 Sep", "20 Sep", "25 Oct", "5 Nov", "10 Nov", "15 Nov", "25 Nov", "5 Dec", "15 Dec", "23 Dec"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
