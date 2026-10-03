"use client";

import { useState } from "react";
import { Avatar } from "./dashboard-screen";
import { IconSearch } from "../icons";

/* ---------- data ---------- */

const SALARY_GROUPS: { group: string; rows: { name: string; salary: string; i: number }[] }[] = [
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

export const CASH_IN = [
  { name: "C. Palmer", from: "MNC", i: 2, date: "1 Sep", amount: "116M €" },
  { name: "D. Petrovic", from: "NE", i: 3, date: "26 Aug", amount: "95M €" },
  { name: "D. Washington", from: "SAN", i: 5, date: "24 Aug", amount: "98M €" },
  { name: "R. Lavia", from: "SOU", i: 8, date: "18 Aug", amount: "110M €" },
  { name: "M. Caicedo", from: "BHA", i: 6, date: "14 Aug", amount: "89M €" },
  { name: "M. Caicedo", from: "BHA", i: 6, date: "14 Aug", amount: "89M €" },
];

export const CASH_OUT = [
  { name: "R. Lukaku", from: "ROMA", i: 7, date: "31 Aug", amount: "119M €" },
  { name: "M. Burstow", from: "SUN", i: 4, date: "25 Aug", amount: "98M €" },
  { name: "B. Humphreys", from: "SWA", i: 9, date: "22 Aug", amount: "118M €" },
  { name: "D. Moreira", from: "LYON", i: 10, date: "19 Aug", amount: "99M €" },
  { name: "F. Anjorin", from: "POR", i: 11, date: "15 Aug", amount: "85M €" },
  { name: "F. Anjorin", from: "POR", i: 11, date: "15 Aug", amount: "85M €" },
];

const SPARK = [3, 2.4, 3.1, 2.2, 2.8, 1.9, 2.6, 2.1, 2.9, 2.3, 3.2, 2.5, 3.4, 2.8, 3.6, 3.0];

export function Spark({ tooltip }: { tooltip?: boolean }) {
  const pts = SPARK.map((v, i) => `${(i / (SPARK.length - 1)) * 100},${40 - v * 10}`).join(" ");
  return (
    <div className="relative rounded-2xl bg-[#f2f5ee] p-4">
      <div className="flex gap-3">
        <div className="flex h-[110px] flex-col justify-between text-right text-[10px] text-[#8a9284]">
          <span>120M</span><span>115M</span><span>110M</span><span>105M</span><span>100M</span>
        </div>
        <div className="relative h-[110px] flex-1">
          {[0, 25, 50, 75, 100].map((x) => (
            <span key={x} className="absolute inset-y-0 w-px bg-[#e2e8dc]" style={{ left: `${x}%` }} />
          ))}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <polyline points={pts} fill="none" stroke="#2e86c8" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          {tooltip ? (
            <div className="absolute -top-2 right-4 flex items-center gap-1.5 rounded-full bg-[#141c10] py-1.5 pl-1.5 pr-3">
              <Avatar i={2} size={20} />
              <span className="flex size-5 items-center justify-center rounded-full bg-[#12356b] text-[8px] font-bold text-white">C</span>
              <span className="text-[13px] font-semibold text-white">109M €</span>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-9 text-[10px] text-[#8a9284]">
        {["15 Sep", "25 Oct", "5 Nov", "15 Nov", "25 Nov", "23 Dec"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
}

export function TransferTable({
  tone,
  title,
  sum,
  rows,
}: {
  tone: "in" | "out";
  title: string;
  sum: string;
  rows: typeof CASH_IN;
}) {
  const tint = tone === "in" ? "bg-[#e9f4e4]" : "bg-[#e3eff8]";
  return (
    <div className={`flex min-w-0 flex-col overflow-hidden rounded-2xl ${tint}`}>
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h4 className="text-[15px] font-semibold text-[#141c10]">{title}</h4>
        <span className="text-[12px] text-[#6d7a68]">
          Total <span className="font-semibold text-[#141c10]">{sum}</span>
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 px-4 pb-1 text-[11px] text-[#8a9284]">
        <span>Jugador</span><span>Origen</span><span>Fecha</span><span className="text-right">Importe</span>
      </div>
      <ul className="no-scrollbar max-h-[240px] overflow-y-auto">
        {rows.map((r, idx) => (
          <li
            key={`${r.name}-${idx}`}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-4 py-2.5 transition hover:bg-white/50"
          >
            <span className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-[#141c10]">
              <Avatar i={r.i} size={26} />
              <span className="truncate">{r.name}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#4c564a]">
              <span className="flex size-5 items-center justify-center rounded-full bg-white text-[8px] font-bold text-[#4c564a]">
                {r.from.slice(0, 2)}
              </span>
              {r.from}
            </span>
            <span className="text-[12px] text-[#4c564a]">{r.date}</span>
            <span className="text-right text-[13px] font-semibold text-[#141c10]">{r.amount}</span>
          </li>
        ))}
      </ul>
      <div className="p-3">
        <Spark tooltip={tone === "out"} />
      </div>
    </div>
  );
}

/* ---------- root ---------- */

export default function TransfersScreen() {
  const [sel, setSel] = useState("M. Bettinelli");
  return (
    <div className="flex h-full w-full overflow-hidden bg-[#111310]">
      <main className="no-scrollbar relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-gradient-to-br from-[#dcefe4] via-[#e8f3e6] to-[#eef4ec] max-md:pb-20">

        {/* club header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-7 md:px-9">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-[#12356b] text-[11px] font-bold text-white">CFC</span>
            <h1 className="text-[28px] font-bold tracking-tight text-[#141c10]">Chelsea Football Club</h1>
            <svg viewBox="0 0 24 24" className="size-5 text-[#4c564a]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </div>
          <div className="flex items-center gap-2">
            <span data-tip="Presupuesto del club" className="flex size-9 items-center justify-center rounded-full bg-white text-[#141c10] shadow-sm">
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

          {/* transfers */}
          <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-5">
                <h3 className="text-[20px] font-semibold text-[#141c10]">Fichajes</h3>
                <span className="text-[17px] font-medium text-[#8a9284]">Próximos fichajes</span>
              </div>
              <span className="text-[16px] font-semibold text-[#141c10]">48,209,087 €</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <TransferTable tone="in" title="Ingresos" sum="1,985,690,534 €" rows={CASH_IN} />
              <TransferTable tone="out" title="Egresos" sum="2,098,459,982 €" rows={CASH_OUT} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
