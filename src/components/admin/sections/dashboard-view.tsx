import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  UsersIcon,
  GamepadIcon,
  BookIcon,
  ShieldIcon,
} from "@/components/icons";

export async function DashboardView({ basePath }: { basePath: string }) {
  const [userCount, roleCounts, lessonCount, teamCount, gameCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
      prisma.lesson.count(),
      prisma.team.count(),
      prisma.lesson.count({ where: { type: "GAME" } }),
    ]);

  const roleMap = Object.fromEntries(roleCounts.map((r) => [r.role, r._count._all]));

  const stats = [
    {
      label: "Usuarios inscritos",
      value: userCount,
      icon: <UsersIcon className="h-5 w-5" />,
      href: `${basePath}/users`,
      color: "bg-blue-500",
    },
    {
      label: "Lecciones",
      value: lessonCount,
      icon: <BookIcon className="h-5 w-5" />,
      href: `${basePath}/lessons`,
      color: "bg-green-500",
    },
    {
      label: "Juegos",
      value: gameCount,
      icon: <GamepadIcon className="h-5 w-5" />,
      href: basePath === "/admin" ? "/admin/settings/lecciones" : `${basePath}/juegos`,
      color: "bg-orange-500",
    },
    {
      label: "Equipos",
      value: teamCount,
      icon: <ShieldIcon className="h-5 w-5" />,
      href: `${basePath}/teams`,
      color: "bg-purple-500",
    },
  ];

  const roles = [
    { key: "SUPERADMIN", label: "Superadministradores", color: "bg-purple-500", count: roleMap["SUPERADMIN"] ?? 0 },
    { key: "ADMIN", label: "Administradores", color: "bg-red-500", count: roleMap["ADMIN"] ?? 0 },
    { key: "ENTRENADOR", label: "Entrenadores", color: "bg-green-500", count: roleMap["ENTRENADOR"] ?? 0 },
    { key: "JUGADOR", label: "Jugadores", color: "bg-blue-500", count: roleMap["JUGADOR"] ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-emerald-950 dark:text-white">Dashboard</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Resumen general de la plataforma. Todo lo que administres aquí se refleja en la app.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-4 shadow-sm transition hover:shadow-md dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-950 dark:text-white">{stat.value}</p>
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-5 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
        <h3 className="font-black text-emerald-950 dark:text-white">Usuarios por rol</h3>
        <div className="mt-4 grid grid-cols-4 gap-4 max-lg:grid-cols-2">
          {roles.map((role) => (
            <div
              key={role.key}
              className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-emerald-900"
            >
              <span className={`h-3 w-3 rounded-full ${role.color}`} />
              <div>
                <p className="text-xl font-black text-emerald-950 dark:text-white">{role.count}</p>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{role.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <Link
          href={`${basePath}/etapas`}
          className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-5 transition hover:shadow-md dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
        >
          <h3 className="flex items-center gap-2 font-black text-emerald-950 dark:text-white">
            <BookIcon className="h-5 w-5 text-green-500" /> Clases y temas
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Organiza las clases y sus temas visibles en el mapa de aprendizaje.
          </p>
          <p className="mt-3 text-sm font-black text-green-600 dark:text-green-400">
            Gestionar clases →
          </p>
        </Link>
        <Link
          href={`${basePath}/lessons`}
          className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-5 transition hover:shadow-md dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
        >
          <h3 className="flex items-center gap-2 font-black text-emerald-950 dark:text-white">
            <GamepadIcon className="h-5 w-5 text-orange-500" /> Lecciones
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Lecciones, quizzes y entrenamientos. Los juegos (Infograma, penales…) van en el panel
            Juegos.
          </p>
          <p className="mt-3 text-sm font-black text-green-600 dark:text-green-400">
            Gestionar contenido →
          </p>
        </Link>
      </div>
    </div>
  );
}
