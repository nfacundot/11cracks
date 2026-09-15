"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function NotificationBell() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count?: number };
      setCount(typeof data.count === "number" ? data.count : 0);
    } catch {
      // sin red: se mantiene el último count
    }
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, [refresh]);

  return (
    <Link
      className="shell-notif-bell"
      href="/jugador/notifications"
      aria-label={count > 0 ? `Notificaciones, ${count} sin leer` : "Notificaciones"}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {count > 0 ? <span className="shell-notif-bell__badge">{count > 99 ? "99+" : count}</span> : null}
    </Link>
  );
}