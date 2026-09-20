"use client";

import Link from "next/link";
import { useState } from "react";
import { IconClose, IconSearch } from "../icons";
import { PcRail } from "./pc-rail";
import { LogoMark } from "./logo-mark";

/* ---------- data ---------- */

type Player = { name: string; pos: string; dim?: boolean };

const PLAYERS: Player[] = [
  { name: "Domingos De Sousa Coutinho…", pos: "Goalkeepers" },
  { name: "Robert Sánchez", pos: "" },
  { name: "Djordje Petrovic", pos: "" },
  { name: "Zlatan Ibrahimović", pos: "" },
  { name: "Lucas Bergström", pos: "" },
  { name: "Benoît Badiashile", pos: "Centre-back" },
  { name: "Seydou Keita Ousmane Maiga", pos: "" },
  { name: "Thiago Silva", pos: "" },
  { name: "Trevoh Chalobah", pos: "" },
  { name: "Thiago Silva", pos: "" },
  { name: "Marc Cucurella", pos: "Defender/wing-back", dim: true },
];

const FROM_RESULTS = [
  { club: "Cardiff City FC.", flag: "🇬🇧" },
  { club: "Cascadia", flag: "🇺🇸" },
  { club: "Charlton Athletic FC.", flag: "🇬🇧" },
  { club: "Chelsea", flag: "🇬🇧" },
];

/* grouped payments per period: [fixed, bonus] heights in % of 20M span */
const SCHEDULE: { label: string; fixed: number; bonus: number }[] = [
  { label: "Nov-Dec", fixed: 88, bonus: 46 },
  { label: "Jan-Feb", fixed: 42, bonus: 30 },
  { label: "Mar-Apr", fixed: 36, bonus: 52 },
  { label: "May-Jun", fixed: 60, bonus: 72 },
  { label: "Jul-Aug", fixed: 12, bonus: 40 },
  { label: "Sep-Oct", fixed: 55, bonus: 34 },
];

const AVATAR_HUES = [24, 12, 200, 150, 340, 280, 40, 190, 260, 8, 120];

export function Avatar({ i, size = 38 }: { i: number; size?: number }) {
  const h = AVATAR_HUES[i % AVATAR_HUES.length];
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, hsl(${h} 45% 62%), hsl(${h + 20} 40% 34%))`,
      }}
    />
  );
}

/* ---------- main panel ---------- */

const TABS = ["Vista general", "Empleo", "Contacto", "Traspaso", "Derechos de imagen", "Agente"];

const FROM_CLUBS = ["Cardiff City FC.", "Cascadia", "Charlton Athletic FC.", "Chelsea"];
const TO_CLUBS = ["Everton FC", "Arsenal FC", "Liverpool FC", "Manchester City"];

function FromCombobox() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("Chelsea");
  return (
    <div className="relative rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
      <p className="text-[12px] text-[#8a9284]">Origen</p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        data-tip="Selecciona el club de origen"
        className="mt-1.5 flex w-full items-center gap-3"
      >
        <IconSearch className="size-4.5 text-[#5c665a]" />
        <span className="flex-1 truncate text-left text-[16px] text-[#1c2418]">{value}</span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 text-[#5c665a] transition ${open ? "" : "rotate-180"}`}
          fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <ul className="absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-12px_rgba(20,30,10,0.35)]">
          {FROM_RESULTS.map((r, i) => (
            <li key={r.club}>
              <button
                type="button"
                onClick={() => {
                  setValue(r.club);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] text-[#1c2418] transition hover:bg-[#eef3ea] ${
                  value === r.club ? "bg-[#eef3ea] font-semibold" : ""
                }`}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-[#dfe8da] text-[10px] font-bold text-[#3c4a36]">{r.club[0]}</span>
                <span>{r.flag}</span>
                {r.club}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function DateField({ label, value, onChange }: { label: string; value: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(new Date(value.getFullYear(), value.getMonth(), 1));
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const startDow = (first.getDay() + 6) % 7; // lunes primero
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const fmt = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  return (
    <div className="relative rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
      <p className="text-[12px] text-[#8a9284]">{label}</p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        data-tip={`Elegir ${label.toLowerCase()}`}
        className="mt-1.5 flex w-full items-center justify-between gap-2"
      >
        <span className="text-[16px] font-medium text-[#1c2418]">{fmt(value)}</span>
        <svg viewBox="0 0 24 24" className="size-4.5 text-[#5c665a]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3.5" y="5" width="17" height="16" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[248px] rounded-2xl bg-white p-3 shadow-[0_18px_40px_-12px_rgba(20,30,10,0.35)]">
          <div className="flex items-center justify-between px-1">
            <button type="button" aria-label="Mes anterior" data-tip="Mes anterior"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              className="flex size-7 items-center justify-center rounded-lg text-[#4c564a] transition hover:bg-[#eef3ea]">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <span className="text-[13px] font-semibold text-[#141c10]">
              {MESES[view.getMonth()]} {view.getFullYear()}
            </span>
            <button type="button" aria-label="Mes siguiente" data-tip="Mes siguiente"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              className="flex size-7 items-center justify-center rounded-lg text-[#4c564a] transition hover:bg-[#eef3ea]">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 5 7 7-7 7" /></svg>
            </button>
          </div>
          <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-semibold text-[#a5b09e]">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-y-0.5 text-center text-[12px]">
            {Array.from({ length: startDow }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const d = i + 1;
              const sel = d === value.getDate() && view.getMonth() === value.getMonth() && view.getFullYear() === value.getFullYear();
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => { onChange(new Date(view.getFullYear(), view.getMonth(), d)); setOpen(false); }}
                  className={`mx-auto flex size-7 items-center justify-center rounded-full transition ${
                    sel ? "bg-[#141c10] font-semibold text-white" : "text-[#1c2418] hover:bg-[#eef3ea]"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldCard({ label, value, calendar }: { label: string; value: string; calendar?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
      <p className="text-[12px] text-[#8a9284]">{label}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[16px] font-medium text-[#1c2418]">{value}</span>
        {calendar ? (
          <svg viewBox="0 0 24 24" className="size-4.5 text-[#5c665a]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3.5" y="5" width="17" height="16" rx="3" />
            <path d="M3.5 10h17M8 3v4M16 3v4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-4 text-[#5c665a]" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
        )}
      </div>
    </div>
  );
}

function ScheduleChart() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[22px] font-semibold text-[#141c10]">Calendario de pagos</h3>
        <div className="flex items-center gap-5 text-[12px] text-[#4c564a]">
          <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#0e7a4e]" />Pago fijo</span>
          <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#2e86c8]" />Pago variable</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {/* y axis */}
        <div className="flex h-[190px] flex-col justify-between py-1 text-right text-[11px] text-[#8a9284]">
          <span>120M</span><span>115M</span><span>110M</span><span>100M</span>
        </div>
        <div className="relative flex-1">
          {/* gridline at 115M */}
          <div className="absolute inset-x-0 top-[32%] border-t border-dashed border-[#c9d2c3]" />
          <div className="flex h-[190px] items-end justify-between gap-3">
            {SCHEDULE.map((s, i) => (
              <div key={s.label} className="relative flex h-full flex-1 items-end justify-center gap-1.5">
                {/* ghost shadows */}
                <span className="pointer-events-none absolute bottom-6 h-3 w-[68%] rounded bg-[#e7ede2]" />
                {i === 2 ? (
                  <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#141c10] px-4 py-2 text-center">
                    <p className="text-[15px] font-semibold text-white">108M €</p>
                    <p className="text-[10px] text-white/60">Pago del Chelsea</p>
                    <span className="absolute -bottom-1 left-1/2 size-2.5 -translate-x-1/2 rotate-45 bg-[#141c10]" />
                  </div>
                ) : null}
                <span className="w-7 rounded-md bg-[#0e7a4e]" style={{ height: `${s.fixed}%` }} />
                <span className="w-7 rounded-md bg-[#2e86c8]" style={{ height: `${s.bonus}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between gap-3 text-[11px] text-[#8a9284]">
            {SCHEDULE.map((s) => (
              <span key={s.label} className="flex-1 text-center">{s.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MainPanel() {
  const [tab, setTab] = useState("Vista general");
  const [toClub, setToClub] = useState("Everton FC");
  const [toOpen, setToOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date(2025, 7, 15));
  const [endDate, setEndDate] = useState(new Date(2028, 7, 15));
  return (
    <section className="no-scrollbar relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-gradient-to-br from-[#dcefe4] via-[#e8f3e6] to-[#eef4ec] px-6 pb-8 pt-6 md:px-9 max-md:pb-24">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar i={1} size={84} />
          <div>
            <p className="text-[13px] text-[#6d7a68]">Dorsal 2</p>
            <h1 className="text-[30px] font-bold leading-tight text-[#141c10]">Robert Sánchez</h1>
            <div className="mt-1 flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[#0e7a4e]">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#0e7a4e] text-[11px] font-bold text-white">€</span>
                48,209,087
              </span>
              <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[#2e86c8]">
                <span className="flex size-5 items-center justify-center rounded-full bg-[#2e86c8] text-[11px] font-bold text-white">$</span>
                48,209,087
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-[#b0453a] shadow-sm transition hover:bg-red-50">
            <IconClose className="size-3.5" /> Eliminar
          </button>
          <button type="button" className="flex items-center gap-2 rounded-xl bg-[#141c10] px-5 py-2.5 text-[13px] font-semibold text-white shadow transition hover:bg-black">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12.5 10 17.5 19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Guardar
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="no-scrollbar mt-7 flex items-center gap-6 overflow-x-auto border-b border-[#c9d6c5] pb-0">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 pb-3 text-[15px] transition ${
              tab === t
                ? "border-b-2 border-[#141c10] font-semibold text-[#141c10]"
                : "text-[#6d7a68] hover:text-[#141c10]"
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto flex shrink-0 items-center gap-2 pb-3">
          <button type="button" aria-label="Añadir" data-tip="Añadir" className="flex size-7 items-center justify-center rounded-lg border border-[#aab8a4] text-[#4c564a] transition hover:bg-white">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <button type="button" aria-label="Editar" data-tip="Editar" className="flex size-7 items-center justify-center rounded-lg border border-[#aab8a4] text-[#4c564a] transition hover:bg-white">
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m14.5 5.5 4 4L8 20H4v-4L14.5 5.5Z" /></svg>
          </button>
        </span>
      </div>

      {/* Main information */}
      <p className="mt-6 text-[13px] text-[#6d7a68]">Información principal</p>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <FromCombobox />
        </div>
        <div className="space-y-4">
          <div className="relative rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(20,30,10,0.06)]">
            <p className="text-[12px] text-[#8a9284]">Destino</p>
            <button
              type="button"
              onClick={() => setToOpen(!toOpen)}
              data-tip="Selecciona el club de destino"
              className="mt-1.5 flex w-full items-center justify-between gap-3"
            >
              <span className="text-[16px] text-[#1c2418]">{toClub}</span>
              <svg
                viewBox="0 0 24 24"
                className={`size-4 text-[#5c665a] transition ${toOpen ? "" : "rotate-180"}`}
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {toOpen ? (
              <ul className="absolute inset-x-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-12px_rgba(20,30,10,0.35)]">
                {TO_CLUBS.map((c, i) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => {
                        setToClub(c);
                        setToOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] text-[#1c2418] transition hover:bg-[#eef3ea] ${
                        i === 0 ? "bg-[#f3f6f0]" : ""
                      }`}
                    >
                      <span className="flex size-6 items-center justify-center rounded-full bg-[#dfe8da] text-[10px] font-bold text-[#3c4a36]">{c[0]}</span>
                      {c}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateField label="Fecha de inicio" value={startDate} onChange={setStartDate} />
            <DateField label="Fecha de fin" value={endDate} onChange={setEndDate} />
          </div>
        </div>
      </div>

      {/* Fee information */}
      <p className="mt-7 text-[13px] text-[#6d7a68]">Información de tarifas</p>
      <div className="mt-3">
        <ScheduleChart />
      </div>

      <button
        type="button"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/80 py-4 text-[14px] font-semibold text-[#141c10] shadow-sm transition hover:bg-white"
      >
        <span className="flex size-5 items-center justify-center rounded-full border border-[#141c10] text-[11px] leading-none">+</span>
        Añadir nueva condición
      </button>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-medium text-[#6d7a68]">
        <Link href="/transfers" className="underline-offset-2 transition hover:text-[#141c10] hover:underline">
          Ventana de fichajes →
        </Link>
        <Link href="/schedule" className="underline-offset-2 transition hover:text-[#141c10] hover:underline">
          Ventana de calendario →
        </Link>
      </div>
    </section>
  );
}

/* ---------- root ---------- */

export default function DashboardScreen() {
  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-[#111310]">
      <PcRail active="equipos" />
      <MainPanel />
    </div>
  );
}
