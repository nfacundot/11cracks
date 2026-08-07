import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { xpToLevel, levelProgress } from "@/lib/streak";
import { Avatar } from "@/components/avatar";
import {
  FlameIcon,
  BoltIcon,
  TrophyIcon,
  GamepadIcon,
  UsersIcon,
  ChevronRightIcon,
} from "@/components/icons";

export const metadata = { title: "Inicio" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [completedCount, gameCount, teamCount, teamXp, unread, nextLesson] = await Promise.all([
    prisma.lessonProgress.count({ where: { userId: user.id, completed: true } }),
    prisma.gameSession.count({ where: { userId: user.id } }),
    prisma.teamMember.count({ where: { userId: user.id } }),
    prisma.teamMember
      .findMany({ where: { userId: user.id }, include: { team: true } })
      .then((members) => members.reduce((acc, m) => acc + m.team.totalXp, 0)),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.lesson.findFirst({
      where: { progress: { none: { userId: user.id, completed: true } } },
      orderBy: { order: "asc" },
      include: {
        progress: { where: { userId: user.id } },
        questions: { select: { id: true } },
      },
    }),
  ]);

  const level = xpToLevel(user.xp);
  const progress = levelProgress(user.xp);
  const barPct = Math.round((progress.current / progress.needed) * 100);

  return (
    <div className="flex flex-col gap-4">
      <section className="flex items-center gap-3 rounded-3xl bg-emerald-950 p-5 text-white">
        <Avatar name={user.name} src={user.avatarUrl} size={56} />
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-green-400">
            ¡Hola, crack!
          </p>
          <h1 className="text-xl font-black leading-tight">{user.name}</h1>
        </div>
        <Link
          href="/notifications"
          className="relative rounded-full bg-white/10 p-2.5 transition hover:bg-white/20"
          aria-label="Notificaciones"
        >
          <TrophyIcon className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black">
              {unread}
            </span>
          )}
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <FlameIcon className="h-6 w-6" />
            <span className="text-3xl font-black">{user.currentStreak}</span>
          </div>
          <p className="mt-1 text-xs font-bold text-orange-100">
            Racha actual
          </p>
          <p className="text-[11px] text-orange-200">
            Récord: {user.bestStreak} 🔥
          </p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <BoltIcon className="h-6 w-6" />
            <span className="text-3xl font-black">{user.xp}</span>
          </div>
          <p className="mt-1 text-xs font-bold text-green-100">XP total</p>
          <p className="text-[11px] text-green-200">Nivel {level}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-green-100 bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-black">Nivel {level}</h2>
          <span className="text-xs font-bold text-zinc-400">
            {progress.current}/{progress.needed} XP
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-600 transition-all"
            style={{ width: `${barPct}%` }}
          />
        </div>
      </section>

      {nextLesson && (
        <Link
          href={`/lesson/${nextLesson.id}`}
          className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-green-100 transition hover:shadow-md"
        >
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
            style={{ backgroundColor: `${nextLesson.color}22` }}
          >
            {nextLesson.emoji}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
              Sigue aprendiendo
            </p>
            <h3 className="font-black">{nextLesson.title}</h3>
            <p className="text-xs text-zinc-500">
              {nextLesson.questions.length} preguntas · {nextLesson.xpReward} XP
            </p>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-green-500" />
        </Link>
      )}

      <section className="grid grid-cols-3 gap-3">
        <Link
          href="/learn"
          className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-green-100"
        >
          <TrophyIcon className="h-6 w-6 text-green-600" />
          <span className="text-lg font-black">{completedCount}</span>
          <span className="text-[10px] font-bold text-zinc-400">Lecciones</span>
        </Link>
        <Link
          href="/games"
          className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-green-100"
        >
          <GamepadIcon className="h-6 w-6 text-blue-500" />
          <span className="text-lg font-black">{gameCount}</span>
          <span className="text-[10px] font-bold text-zinc-400">Juegos</span>
        </Link>
        <Link
          href="/teams"
          className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-green-100"
        >
          <UsersIcon className="h-6 w-6 text-amber-500" />
          <span className="text-lg font-black">{teamCount}</span>
          <span className="text-[10px] font-bold text-zinc-400">Equipos</span>
        </Link>
      </section>

      {teamXp > 0 && (
        <section className="rounded-3xl bg-white p-5 ring-1 ring-green-100">
          <h2 className="font-black">Puntos de tus equipos</h2>
          <p className="mt-1 text-2xl font-black text-green-600">{teamXp} XP</p>
        </section>
      )}
    </div>
  );
}
