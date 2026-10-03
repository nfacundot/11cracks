"use client";

import { useEffect, useState } from "react";

export function Goal50MessageBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const run = () => {
      fetch("/api/messages/unread", { cache: "no-store" })
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
    window.addEventListener("goal50:messages-read", run);
    const id = window.setInterval(run, 60_000);
    return () => {
      active = false;
      window.removeEventListener("focus", run);
      window.removeEventListener("goal50:messages-read", run);
      window.clearInterval(id);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("goal50:open-messages"))}
      aria-label={count > 0 ? `Mensajes, ${count} sin leer` : "Mensajes"}
      data-tipb="Mensajes"
      className="goal50-tile relative flex size-7 items-center justify-center rounded-full"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 17.5H8.5L4 21V7a1.5 1.5 0 0 1 1.5-1.5Z" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white/20">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
