import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { BellIcon, BoltIcon, CoinIcon, FlameIcon, TrophyIcon } from "@/components/icons";

export async function TopBar({ user }: { user: SessionUser }) {
  const unread = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <header className="sticky top-0 z-20">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 py-3">
        <div className="flex flex-1 items-center justify-between gap-1">
          <span className="flex min-w-0 items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-1.5 backdrop-blur">
            <BoltIcon className="h-4 w-4 shrink-0 text-amber-300" />
            <span className="truncate text-sm font-bold text-white">{user.xp}</span>
          </span>

          <span className="flex min-w-0 items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-1.5 backdrop-blur">
            <CoinIcon className="h-4 w-4 shrink-0 text-yellow-400" />
            <span className="truncate text-sm font-bold text-white">{user.coins}</span>
          </span>

          <span className="flex min-w-0 items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-1.5 backdrop-blur">
            <FlameIcon className="h-4 w-4 shrink-0 text-orange-400" />
            <span className="truncate text-sm font-bold text-white">{user.currentStreak}</span>
          </span>

          <span className="flex min-w-0 items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-1.5 backdrop-blur">
            <TrophyIcon className="h-4 w-4 shrink-0 text-purple-300" />
            <span className="truncate text-sm font-bold text-white">{user.trophies}</span>
          </span>
        </div>

        <Link
          href="/notifications"
          aria-label="Notificaciones"
          className="relative shrink-0 rounded-full bg-emerald-950/60 p-1.5 text-white backdrop-blur transition hover:bg-emerald-950/80"
        >
          <BellIcon className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
