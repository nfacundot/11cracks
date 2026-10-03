"use client";

import { useEffect, useState } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/user";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  icon: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function formatWhen(iso: string) {
  const time = new Date(iso);
  const dateStr = time.toLocaleDateString("es", { day: "numeric", month: "short" });
  const hourStr = time.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} · ${hourStr}`;
}

async function fetchNotifications(): Promise<Notif[]> {
  try {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { notifications?: Notif[] };
    return data.notifications ?? [];
  } catch {
    return [];
  }
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchNotifications().then((list) => {
      if (!active) return;
      setItems(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const reload = async () => {
    setItems(await fetchNotifications());
  };

  const markAll = async () => {
    setBusy(true);
    await markAllNotificationsRead();
    await reload();
    window.dispatchEvent(new CustomEvent("goal50:notifications-read"));
    setBusy(false);
  };

  const openOne = async (item: Notif) => {
    if (!item.read) {
      await markNotificationRead(item.id);
      await reload();
      window.dispatchEvent(new CustomEvent("goal50:notifications-read"));
    }
    if (item.link) {
      window.location.assign(item.link);
    }
  };

  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto flex max-w-[760px] flex-col gap-3">
        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="goal50-text text-[20px] font-extrabold uppercase leading-none tracking-tight">Notificaciones</h1>
            <p className="goal50-text-dim mt-1 text-[12px]">{unread > 0 ? `${unread} sin leer` : "Todo al día"}</p>
          </div>
          {items.length > 0 ? (
            <button
              type="button"
              onClick={markAll}
              disabled={busy || unread === 0}
              className="goal50-tile goal50-text rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] transition disabled:opacity-40"
            >
              Marcar todo como leído
            </button>
          ) : null}
        </header>

        {loading ? (
          <p className="goal50-text-dim py-10 text-center text-[12px]">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border px-4 py-12 text-center" style={{ background: "var(--g50-msgbox)", borderColor: "var(--g50-glass-border)" }}>
            <div className="text-4xl">📭</div>
            <p className="goal50-text mt-3 text-[13px] font-bold">Sin notificaciones</p>
            <p className="goal50-text-dim mt-1 text-[12px]">
              Cuando completes lecciones o juegos, verás tus logros aquí.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openOne(item)}
                className="flex items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition"
                style={{
                  background: item.read ? "var(--g50-msgbox)" : "var(--g50-tile)",
                  borderColor: item.read ? "var(--g50-glass-border)" : "rgba(198,242,50,0.45)",
                }}
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[18px]"
                  style={{ background: "var(--g50-msgbox)" }}
                >
                  {item.icon ?? "🔔"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="goal50-text truncate text-[13px] font-bold">{item.title}</p>
                    {!item.read ? <span className="size-2 shrink-0 rounded-full bg-lime" /> : null}
                  </div>
                  <p className="goal50-text-dim line-clamp-2 text-[12px]">{item.body}</p>
                  <p className="goal50-text-dim mt-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {formatWhen(item.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
