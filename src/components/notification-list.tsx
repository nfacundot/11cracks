"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/user";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  icon?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: Date;
};

const typeColor: Record<string, string> = {
  STREAK: "bg-orange-50 ring-orange-100",
  XP: "bg-green-50 ring-green-100",
  LESSON: "bg-emerald-50 ring-emerald-100",
  GAME: "bg-blue-50 ring-blue-100",
  TEAM: "bg-amber-50 ring-amber-100",
  SYSTEM: "bg-zinc-50 ring-zinc-100",
};

export function NotificationList({ notifications }: { notifications: Notif[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const markAll = async () => {
    setBusy(true);
    await markAllNotificationsRead();
    router.refresh();
    setBusy(false);
  };

  const open = async (n: Notif) => {
    if (!n.read) {
      await markNotificationRead(n.id);
      router.refresh();
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {notifications.length > 0 && (
        <button
          onClick={markAll}
          disabled={busy}
          className="self-end text-xs font-black text-green-600 transition hover:text-green-700 disabled:opacity-50"
        >
          Marcar todo como leído
        </button>
      )}

      {notifications.map((n) => {
        const time = new Date(n.createdAt);
        const dateStr = time.toLocaleDateString("es", {
          day: "numeric",
          month: "short",
        });
        const hourStr = time.toLocaleTimeString("es", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const content = (
          <>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
              {n.icon ?? "🔔"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`truncate text-sm font-black ${n.read ? "text-zinc-500" : ""}`}>
                  {n.title}
                </p>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />}
              </div>
              <p className="line-clamp-2 text-xs text-zinc-500">{n.body}</p>
              <p className="mt-0.5 text-[10px] font-bold text-zinc-400">
                {dateStr} · {hourStr}
              </p>
            </div>
          </>
        );

        const containerCls = `flex items-center gap-3 rounded-2xl p-4 ring-1 transition ${
          typeColor[n.type] ?? "bg-white ring-zinc-100"
        }`;

        return n.link ? (
          <button key={n.id} onClick={() => open(n)} className={`${containerCls} text-left`}>
            {content}
          </button>
        ) : (
          <div key={n.id} onClick={() => !n.read && open(n)} className={containerCls}>
            {content}
          </div>
        );
      })}

      {notifications.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-5xl">📭</div>
          <p className="mt-3 font-black">Sin notificaciones</p>
          <p className="text-sm text-zinc-500">
            Cuando completes lecciones o juegos, verás tus logros aquí.
          </p>
          <Link href="/learn" className="mt-4 inline-block rounded-2xl bg-green-500 px-6 py-3 font-black text-white">
            Ir a aprender
          </Link>
        </div>
      )}
    </div>
  );
}
