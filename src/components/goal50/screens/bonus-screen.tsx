"use client";

import { Avatar } from "./dashboard-screen";

const ROWS = [
  { name: "M. Caicedo", payer: "J. Perez", recv: "S. Pochettino", date: "14 Aug", amount: "89M €", pct: 72, i: 6 },
  { name: "D. Petrovic", payer: "J. Perez", recv: "S. Pochettino", date: "26 Aug", amount: "95M €", pct: 58, i: 3 },
  { name: "R. Lavia", payer: "M. Pochettino", recv: "S. Pochettino", date: "18 Aug", amount: "110M €", pct: 80, i: 8 },
  { name: "C. Palmer", payer: "M. Pochettino", recv: "S. Pochettino", date: "1 Sep", amount: "116M €", pct: 90, i: 2 },
  { name: "D. Washington", payer: "M. Pochettino", recv: "S. Pochettino", date: "27 Aug", amount: "98M €", pct: 64, i: 5 },
  { name: "A. Disasi", payer: "J. Perez", recv: "S. Pochettino", date: "24 Aug", amount: "75M €", pct: 46, i: 7 },
  { name: "T. Silva", payer: "M. Pochettino", recv: "S. Pochettino", date: "24 Aug", amount: "70M €", pct: 52, i: 9 },
  { name: "M. Bettinelli", payer: "M. Pochettino", recv: "S. Pochettino", date: "22 Aug", amount: "45M €", pct: 38, i: 4 },
  { name: "R. Sánchez", payer: "M. Pochettino", recv: "S. Pochettino", date: "12 Aug", amount: "98M €", pct: 66, i: 1 },
];

function Donut({ pct }: { pct: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 24 24" className="size-6">
      <circle cx="12" cy="12" r={r} fill="none" stroke="#f3ecd2" strokeWidth="5" />
      <circle
        cx="12" cy="12" r={r} fill="none" stroke="#f2b53a" strokeWidth="5"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

export default function BonusScreen() {
  return (
    <div className="h-full w-full overflow-y-auto bg-[#f0f1ea] p-5">
      <section className="rounded-3xl bg-[#fbf6d9] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-[#141c10]">Upcoming bonus</h2>
          <p className="text-[13px] text-[#6d7a68]">
            Sum <span className="font-semibold text-[#141c10]">1,985,690,534 €</span>
          </p>
        </div>

        <div className="mt-3 grid grid-cols-[1.2fr_1.5fr_0.7fr_0.8fr_auto] gap-x-3 text-[11px] text-[#8a9284]">
          <span>Player</span>
          <span>Cash payer / Receiver</span>
          <span>Date</span>
          <span>Amount</span>
          <span className="w-8" />
        </div>

        <ul className="mt-1.5 space-y-0.5">
          {ROWS.map((r, idx) => (
            <li
              key={`${r.name}-${idx}`}
              className="grid grid-cols-[1.2fr_1.5fr_0.7fr_0.8fr_auto] items-center gap-x-3 rounded-xl px-1 py-2 transition hover:bg-white/60"
            >
              <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[#141c10]">
                <Avatar i={r.i} size={28} />
                <span className="truncate">{r.name}</span>
              </span>
              <span className="truncate text-[12px] text-[#4c564a]">
                {r.payer} <span className="text-[#a5b09e]">/</span> {r.recv}
              </span>
              <span className="text-[12px] text-[#4c564a]">{r.date}</span>
              <span className="text-[13px] font-semibold text-[#141c10]">{r.amount}</span>
              <span data-tip={`${r.pct}% cobrado`} className="justify-self-end">
                <Donut pct={r.pct} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
