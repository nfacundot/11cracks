"use client";

import { useEffect, useState } from "react";

export function Goal50FriendBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const run = () => {
      fetch("/api/friends/incoming-count", { cache: "no-store" })
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
    window.addEventListener("goal50:friends-changed", run);
    const id = window.setInterval(run, 60_000);
    return () => {
      active = false;
      window.removeEventListener("focus", run);
      window.removeEventListener("goal50:friends-changed", run);
      window.clearInterval(id);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("goal50:open-friends"))}
      aria-label={count > 0 ? `Amigos, ${count} solicitud${count === 1 ? "" : "es"} entrante${count === 1 ? "" : "s"}` : "Amigos"}
      data-tipb="Amigos"
      className="goal50-tile relative flex size-7 items-center justify-center rounded-full"
    >
      <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.4 19.2c.9-3.1 3.1-4.8 5.6-4.8s4.7 1.7 5.6 4.8" />
        <path d="M16.2 5.6a3 3 0 0 1 0 5.4M17.6 14.6c1.6.6 2.7 2 3.3 4.1" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white/20">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
