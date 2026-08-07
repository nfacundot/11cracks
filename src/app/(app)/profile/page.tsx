import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { xpToLevel, levelProgress } from "@/lib/streak";
import { AvatarUpload } from "@/components/avatar-upload";
import { ProfileForm } from "@/components/profile-form";
import { LogoutButton } from "@/components/logout-button";
import {
  FlameIcon,
  BoltIcon,
  TrophyIcon,
  GamepadIcon,
  UsersIcon,
  StarIcon,
} from "@/components/icons";

export const metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const user = await requireUser();

  const [lessonsDone, gamesPlayed, teamsCount, streakDays] = await Promise.all([
    prisma.lessonProgress.count({ where: { userId: user.id, completed: true } }),
    prisma.gameSession.count({ where: { userId: user.id } }),
    prisma.teamMember.count({ where: { userId: user.id } }),
    prisma.streakDay.count({ where: { userId: user.id } }),
  ]);

  const level = xpToLevel(user.xp);
  const progress = levelProgress(user.xp);
  const barPct = Math.round((progress.current / progress.needed) * 100);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-green-100">
        <AvatarUpload name={user.name} src={user.avatarUrl} />
        <div className="text-center">
          <h1 className="text-2xl font-black">{user.name}</h1>
          <p className="text-sm text-zinc-500">@{user.username}</p>
          {user.bio && <p className="mt-2 text-sm text-zinc-600">{user.bio}</p>}
        </div>

        <div className="mt-2 flex w-full flex-wrap justify-center gap-2">
          {user.position && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
              {user.position}
            </span>
          )}
          {user.favoriteTeam && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
              ⚽ {user.favoriteTeam}
            </span>
          )}
          {user.country && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
              🌍 {user.country}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-emerald-950 p-5 text-white">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-green-300">
            Nivel {level}
          </p>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-black">
            <FlameIcon className="h-3.5 w-3.5 text-orange-400" />
            Racha {user.currentStreak}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-green-400 transition-all"
            style={{ width: `${barPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-green-200/70">
          {progress.current}/{progress.needed} XP para el nivel {level + 1}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-green-100">
          <div className="flex items-center gap-2 text-green-600">
            <BoltIcon className="h-5 w-5" />
            <span className="text-2xl font-black">{user.xp}</span>
          </div>
          <p className="text-xs font-bold text-zinc-400">XP total</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-green-100">
          <div className="flex items-center gap-2 text-orange-500">
            <StarIcon className="h-5 w-5" />
            <span className="text-2xl font-black">{streakDays}</span>
          </div>
          <p className="text-xs font-bold text-zinc-400">Días activos</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-green-100">
          <div className="flex items-center gap-2 text-emerald-600">
            <TrophyIcon className="h-5 w-5" />
            <span className="text-2xl font-black">{lessonsDone}</span>
          </div>
          <p className="text-xs font-bold text-zinc-400">Lecciones</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-green-100">
          <div className="flex items-center gap-2 text-blue-500">
            <GamepadIcon className="h-5 w-5" />
            <span className="text-2xl font-black">{gamesPlayed}</span>
          </div>
          <p className="text-xs font-bold text-zinc-400">Juegos</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-green-100">
        <h2 className="mb-3 flex items-center gap-2 font-black">
          <UsersIcon className="h-5 w-5 text-amber-500" />
          Editar perfil
        </h2>
        <ProfileForm user={user} />
      </section>

      <div className="flex flex-col gap-2">
        <Link
          href="/teams"
          className="w-full rounded-2xl border-2 border-green-200 py-3 text-center font-bold text-green-700 transition hover:bg-green-50"
        >
          Mis equipos ({teamsCount})
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
