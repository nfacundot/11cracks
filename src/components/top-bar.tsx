import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { BellIcon, FlameIcon } from "@/components/icons";

export async function TopBar({ user }: { user: SessionUser }) {
  const unread = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return (
    <header className="sticky top-0 z-20 border-b border-green-100 bg-emerald-950/95 text-white backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold">
          <FlameIcon className="h-4 w-4 text-orange-400" />
          <span>{user.currentStreak}</span>
        </div>

        <Link href="/dashboard" className="text-lg font-black tracking-tight">
          11<span className="text-green-400">Cracks</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            aria-label="Notificaciones"
            className="relative rounded-full p-1.5 transition hover:bg-white/10"
          >
            <BellIcon className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link href="/profile" aria-label="Perfil">
            <Avatar name={user.name} src={user.avatarUrl} size={32} />
          </Link>
        </div>
      </div>
    </header>
  );
}
