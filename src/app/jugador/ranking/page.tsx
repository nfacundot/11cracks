import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { parseAvatarConfig } from "@/lib/avatar";
import { xpToLevel } from "@/lib/streak";
import { BoltIcon, TrophyIcon } from "@/components/icons";

export const metadata = { title: "Ranking" };

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function RankingPage() {
  const me = await requireUser();

  const [topUsers, higherCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
      take: 100,
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        avatarConfig: true,
        xp: true,
      },
    }),
    prisma.user.count({ where: { xp: { gt: me.xp } } }),
  ]);

  const myRank = higherCount + 1;
  const inList = topUsers.some((u) => u.id === me.id);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-2">
        <TrophyIcon className="h-6 w-6 text-amber-500" />
        <h1 className="text-xl font-black">Ranking</h1>
      </header>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Los cracks con más XP de la plataforma. ¡Suma puntos y sube de posición!
      </p>

      <div className="grid grid-cols-3 gap-2">
        {topUsers.slice(0, 3).map((u, i) => {
          const isMe = u.id === me.id;
          return (
            <div
              key={u.id}
              className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center shadow-sm ring-1 backdrop-blur-xl ${
                isMe
                  ? "bg-green-500/10 ring-green-400/40"
                  : "bg-white/60 ring-green-100 dark:bg-emerald-950/60 dark:ring-green-900"
              }`}
            >
              <span className="text-2xl">{MEDALS[i]}</span>
              <Avatar
                name={u.name}
                src={u.avatarUrl}
                config={parseAvatarConfig(u.avatarConfig)}
                size={56}
                className="ring-2 ring-white dark:ring-emerald-800"
              />
              <p className="w-full truncate text-xs font-black">{u.name}</p>
              <p className="flex items-center gap-0.5 text-[11px] font-bold text-zinc-400 dark:text-zinc-500">
                <BoltIcon className="h-3 w-3" /> {u.xp} XP
              </p>
              {isMe && (
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-black text-white">
                  Tú
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!inList && (
        <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-center text-sm font-bold text-amber-600 dark:text-amber-400">
          Estás en la posición #{myRank} · Nivel {xpToLevel(me.xp)}. Los 100 mejores
          aparecen en la lista.
        </div>
      )}

      <ol className="flex flex-col gap-2">
        {topUsers.map((u, idx) => {
          const isMe = u.id === me.id;
          const rank = idx + 1;
          return (
            <li
              key={u.id}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 shadow-sm ring-1 backdrop-blur-xl ${
                isMe
                  ? "bg-green-500/10 ring-green-400/40"
                  : "bg-white/60 ring-green-100 dark:bg-emerald-950/60 dark:ring-green-900"
              }`}
            >
              <span className="w-7 text-center text-sm font-black text-zinc-400 dark:text-zinc-500">
                {rank}
              </span>
              <Avatar
                name={u.name}
                src={u.avatarUrl}
                config={parseAvatarConfig(u.avatarConfig)}
                size={40}
                className="ring-2 ring-white dark:ring-emerald-800"
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-black">
                  {u.name}
                  {isMe && (
                    <span className="rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                      Tú
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                  @{u.username} · Nivel {xpToLevel(u.xp)}
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-black text-emerald-600 dark:text-emerald-400">
                <BoltIcon className="h-4 w-4" />
                {u.xp}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
