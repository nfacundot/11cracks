"use client";

import { useEffect, useState } from "react";

export function Goal50NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const run = () => {
      fetch("/api/notifications/unread", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
        .then((data: { count?: number }) => {
          if (active) setCount(typeof data.count === "number" ? data.count : 0);
        })
        .catch(() => {
          /* sin red: se mantiene el último valor */
        });
    };

    run();
    window.addEventListener("focus", run);
    window.addEventListener("goal50:notifications-read", run);
    const id = window.setInterval(run, 60_000);
    return () => {
      active = false;
      window.removeEventListener("focus", run);
      window.removeEventListener("goal50:notifications-read", run);
      window.clearInterval(id);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("goal50:open-notifications"))}
      aria-label={count > 0 ? `Notificaciones, ${count} sin leer` : "Notificaciones"}
      data-tipb="Notificaciones"
      className="goal50-tile relative flex size-7 items-center justify-center rounded-full"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white/20">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
