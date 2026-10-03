"use client";

import { useEffect, useState } from "react";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function Goal50Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (!now) {
    return <span className="goal50-text-dim text-[12px] font-medium tabular-nums">—</span>;
  }

  const hour = now.getHours();
  const isDay = hour >= 6 && hour < 19;
  const dateStr = now.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const hour12 = hour % 12 || 12;
  const meridiem = hour >= 12 ? "PM" : "AM";
  const timeStr = `${hour12}:${minutes}:${seconds} ${meridiem}`;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("goal50:open-calendar"))}
      title="Abrir calendario"
      aria-label="Abrir calendario"
      className="goal50-text flex items-center gap-2 rounded-lg px-2 py-1 text-[12px] font-medium tabular-nums transition hover:bg-white/10"
    >
      <span
        className={`flex size-6 items-center justify-center rounded-full ${
          isDay ? "text-[#e0a800]" : "text-[#8ea9c9]"
        }`}
        title={isDay ? "Día" : "Noche"}
        aria-label={isDay ? "Día" : "Noche"}
      >
        {isDay ? <SunIcon /> : <MoonIcon />}
      </span>
      <span className="hidden capitalize sm:inline">{dateStr}</span>
      <span className="goal50-text-dim hidden sm:inline">·</span>
      <span>{timeStr}</span>
    </button>
  );
}
