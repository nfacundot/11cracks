"use client";

import { useState } from "react";
import { Avatar } from "./dashboard-screen";
import { IconSearch } from "../icons";
import { CASH_IN, CASH_OUT, Spark, TransferTable } from "./transfers-screen";
import { PcRail } from "./pc-rail";

const SALARY_GROUPS = [
  {
    group: "Porteros",
    rows: [
      { name: "R. Sánchez", salary: "585,990 €", i: 1 },
      { name: "M. Bettinelli", salary: "450,500 €", i: 4 },
      { name: "D. Petrovic", salary: "500,000 €", i: 3 },
      { name: "T. Curd", salary: "570,000 €", i: 5 },
      { name: "L. Bergström", salary: "350,500 €", i: 6 },
    ],
  },
  {
    group: "Defensas centrales",
    rows: [
      { name: "A. Disasi", salary: "750,000 €", i: 7 },
      { name: "B. Badiashile", salary: "650,450 €", i: 8 },
      { name: "T. Silva", salary: "700,000 €", i: 9 },
      { name: "T. Silva", salary: "700,000 €", i: 10 },
      { name: "T. Silva", salary: "700,000 €", i: 11 },
    ],
  },
];

/* Replica of the reference window, named "Payment Schedule" to keep it
   distinct from the /pc/transfers window that shares the same layout. */
export default function ScheduleScreen() {
  const [sel, setSel] = useState("M. Bettinelli");
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#111310]">
      <PcRail active="calendario" />
      <main className="no-scrollbar relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-gradient-to-br from-[#dcefe4] via-[#e8f3e6] to-[#eef4ec] max-md:pb-20">

        {/* club header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-7 md:px-9">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-[#12356b] text-[11px] font-bold text-white">CFC</span>
            <h1 className="text-[28px] font-bold tracking-tight text-[#141c10]">Chelsea Football Club</h1>
            <svg viewBox="0 0 24 24" className="size-5 text-[#4c564a]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-white text-[#141c10] shadow-sm">
              <svg viewBox="0 0 24 24" className="size-4.5" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6" width="18" height="13" rx="2.5" /><circle cx="12" cy="12.5" r="2.6" /><path d="M6 9.5v.01M18 9.5v.01" strokeLinecap="round" /></svg>
            </span>
            <span className="text-[30px] font-bold tracking-tight text-[#141c10]">895,093,456 €</span>
          </div>
        </div>

        {/* stats row */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-4 md:px-9">
          <div className="flex flex-wrap gap-6">
            {[
              ["250,789,980 €", "text-[#141c10]"],
              ["150,783,543 €", "text-[#0e7a4e]"],
              ["100,006,437 €", "text-[#2e86c8]"],
            ].map(([v, c], i) => (
              <span key={i} className={`flex items-center gap-2 text-[16px] font-semibold ${c}`}>
                <span className="flex size-5 items-center justify-center rounded-full border border-current text-[10px]">€</span>
                {v}
              </span>
            ))}
          </div>
          <button type="button" className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-[#141c10] shadow-sm">
            📅 15 Sep - 23 Dec 2023
            <svg viewBox="0 0 24 24" className="size-4 text-[#5c665a]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>

        {/* content grid */}
        <div className="grid flex-1 grid-cols-1 gap-5 p-6 md:px-9 lg:grid-cols-[340px_1fr]">
          {/* salary */}
          <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-semibold text-[#141c10]">Salarios</h3>
              <span className="text-[15px] font-semibold text-[#141c10]">168,983,435 €</span>
            </div>
            <label className="mt-3 flex items-center gap-2.5 rounded-full bg-[#f2f5ee] px-4 py-2.5">
              <IconSearch className="size-4 text-[#8a9284]" />
              <input placeholder="Buscar" className="w-full bg-transparent text-[13px] text-[#141c10] placeholder:text-[#a5b09e] outline-none" />
            </label>
            <div className="no-scrollbar mt-2 max-h-[520px] overflow-y-auto">
              {SALARY_GROUPS.map((g) => (
                <div key={g.group}>
                  <p className="px-2 pb-1.5 pt-4 text-[12px] text-[#8a9284]">{g.group}</p>
                  {g.rows.map((r) => (
                    <button
                      key={`${r.name}-${r.i}`}
                      type="button"
                      onClick={() => setSel(r.name)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition ${
                        sel === r.name ? "bg-[#f2f5ee]" : "hover:bg-[#f7f9f4]"
                      }`}
                    >
                      <Avatar i={r.i} size={34} />
                      <span className="flex-1 truncate text-[14px] font-medium text-[#141c10]">{r.name}</span>
                      <span className="text-[13px] font-semibold text-[#141c10]">{r.salary}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* payment schedule */}
          <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-5">
                <h3 className="text-[20px] font-semibold text-[#141c10]">Calendario</h3>
                <span className="text-[17px] font-medium text-[#8a9284]">Próximos pagos</span>
              </div>
              <span className="text-[16px] font-semibold text-[#141c10]">48,209,087 €</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <TransferTable tone="in" title="Entradas programadas" sum="1,985,690,534 €" rows={CASH_IN} />
              <TransferTable tone="out" title="Salidas programadas" sum="2,098,459,982 €" rows={CASH_OUT} />
            </div>
            <div className="mt-4">
              <Spark />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
