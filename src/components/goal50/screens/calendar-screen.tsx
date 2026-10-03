"use client";

import { useEffect, useState } from "react";
import type { CalendarEvent } from "@/lib/calendar";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayIso() {
  const t = new Date();
  return isoDate(t.getFullYear(), t.getMonth(), t.getDate());
}

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(todayIso());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/calendar", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((data: { events: CalendarEvent[] }) => {
        if (active) setEvents(data.events);
      })
      .catch(() => {
        /* sin conexión */
      });
    return () => {
      active = false;
    };
  }, []);

  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const today = todayIso();

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelected(todayIso());
  };

  const dayEvents = events.filter((event) => event.date === selected);
  const countFor = (iso: string) => events.filter((event) => event.date === iso).length;

  const selectStyle = {
    background: "var(--g50-msgbox)",
    borderColor: "var(--g50-glass-border)",
  } as const;

  return (
    <div className="mx-auto flex h-full w-full max-w-[820px] flex-col gap-3 p-4 md:p-6">
      {/* Cabecera: mes / año */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={prevMonth} aria-label="Mes anterior" className="goal50-tile flex size-8 items-center justify-center rounded-lg">
          ‹
        </button>
        <div className="flex flex-1 items-center justify-center gap-2">
          <select
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            className="goal50-text rounded-lg border px-2 py-1 text-[13px] font-bold outline-none"
            style={selectStyle}
          >
            {MONTHS.map((label, index) => (
              <option key={label} value={index}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="goal50-text rounded-lg border px-2 py-1 text-[13px] font-bold outline-none"
            style={selectStyle}
          >
            {Array.from({ length: 21 }, (_, i) => now.getFullYear() - 10 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={nextMonth} aria-label="Mes siguiente" className="goal50-tile flex size-8 items-center justify-center rounded-lg">
          ›
        </button>
      </div>

      <button type="button" onClick={goToday} className="goal50-text-dim self-center text-[11px] font-semibold underline-offset-2 hover:underline">
        Hoy
      </button>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <span key={day} className="goal50-text-dim text-[10px] font-bold uppercase tracking-wide">
            {day}
          </span>
        ))}
      </div>

      {/* Rejilla del mes */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDow }).map((_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1;
          const iso = isoDate(year, month, day);
          const count = countFor(iso);
          const isToday = iso === today;
          const isSelected = iso === selected;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelected(iso)}
              className="goal50-text relative flex aspect-square flex-col items-center justify-center rounded-lg border text-[12px] font-semibold transition"
              style={{
                background: isSelected ? "rgba(198,242,50,0.22)" : "var(--g50-tile)",
                borderColor: isSelected ? "rgba(198,242,50,0.6)" : isToday ? "var(--brand-gold-bright)" : "var(--g50-glass-border)",
                color: isSelected ? "var(--g50-on-glass)" : isToday ? "var(--brand-gold-bright)" : "var(--g50-on-glass)",
              }}
            >
              {day}
              {count > 0 ? (
                <span className="absolute bottom-1 flex size-3.5 items-center justify-center rounded-full bg-lime text-[8px] font-bold text-black">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Eventos del día */}
      <div className="mt-1 flex min-h-0 flex-1 flex-col gap-2">
        <p className="goal50-text-dim text-[11px] font-bold uppercase tracking-[0.12em]">Eventos · {selected}</p>
        <div className="no-scrollbar flex-1 overflow-y-auto">
          {dayEvents.length === 0 ? (
            <p className="goal50-text-dim py-2 text-[12px]">Sin eventos para este día.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {dayEvents.map((event) => (
                <li
                  key={event.id}
                  className="goal50-text flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px]"
                  style={{ background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" }}
                >
                  <span className="min-w-0 flex-1 truncate">{event.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
