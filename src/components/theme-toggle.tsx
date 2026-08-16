"use client";

import { useState } from "react";

export function ThemeToggle() {
  const [light, setLight] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("light"),
  );

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    document.documentElement.classList.toggle("dark", !next);
    try {
      localStorage.setItem("11cracks-theme", next ? "light" : "dark");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center justify-between rounded-2xl border-2 border-green-200 py-3 px-4 font-bold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/40"
    >
      <span className="flex items-center gap-2">
        <span className="text-lg">{light ? "☀️" : "🌙"}</span>
        Modo {light ? "claro" : "oscuro"}
      </span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          light ? "bg-zinc-300" : "bg-green-500"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            light ? "left-0.5" : "left-[22px]"
          }`}
        />
      </span>
    </button>
  );
}
