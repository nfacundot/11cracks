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
  STREAK: "bg-orange-50 ring-orange-100 dark:bg-orange-950/60 dark:ring-orange-900/50",
  XP: "bg-green-50 ring-green-100 dark:bg-green-950/60 dark:ring-green-900/50",
  LESSON: "bg-emerald-50 ring-emerald-100 dark:bg-emerald-950/60 dark:ring-emerald-900/50",
  GAME: "bg-blue-50 ring-blue-100 dark:bg-blue-950/60 dark:ring-blue-900/50",
  TEAM: "bg-amber-50 ring-amber-100 dark:bg-amber-950/60 dark:ring-amber-900/50",
  SYSTEM: "bg-zinc-50 ring-zinc-100 dark:bg-zinc-900/60 dark:ring-zinc-800",
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
          className="self-end text-xs font-black text-green-600 transition hover:text-green-700 disabled:opacity-50 dark:text-green-400 dark:hover:text-green-300"
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-emerald-900">
              {n.icon ?? "🔔"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className={`truncate text-sm font-black ${n.read ? "text-zinc-500 dark:text-zinc-500" : ""}`}>
                  {n.title}
                </p>
                {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />}
              </div>
              <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">{n.body}</p>
              <p className="mt-0.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                {dateStr} · {hourStr}
              </p>
            </div>
          </>
        );

        const containerCls = `flex items-center gap-3 rounded-2xl p-4 ring-1 transition ${
          typeColor[n.type] ?? "bg-white/60 backdrop-blur-xl ring-zinc-100 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:ring-zinc-800"
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
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
