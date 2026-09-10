import { prisma } from "@/lib/prisma";
import { PROTECTED_EMAILS } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { parseAvatarConfig } from "@/lib/avatar";
import { UserRoleSelect, DeleteUserButton } from "@/components/admin/user-role-select";
import { UsersIcon } from "@/components/icons";
import { UsersToolbar } from "@/components/admin/users-toolbar";
import Link from "next/link";

const ROLE_BADGES: Record<string, string> = {
  SUPERADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  ADMIN: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  ENTRENADOR: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  JUGADOR: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
};

const DEFAULT_PAGE_SIZE = 10;

interface UsersViewProps {
  viewerIsSuperadmin: boolean;
  page: number;
  pageSize: number;
}

export async function UsersView({ viewerIsSuperadmin, page, pageSize }: UsersViewProps) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(pageSize, 100));
  const skip = (safePage - 1) * safePageSize;

  const [users, total, teams] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: safePageSize,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        avatarUrl: true,
        avatarConfig: true,
        xp: true,
        coins: true,
        trophies: true,
        currentStreak: true,
        createdAt: true,
        _count: { select: { gameSessions: true, lessonsCompleted: true } },
      },
    }),
    prisma.user.count(),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(total / safePageSize);
  const byRole = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <article className="admin-page">
      <header className="admin-page__header">
        <span>ADMIN · ACCESOS</span>
        <h1>Usuarios</h1>
        <p>Administra jugadores y entrenadores autorizados.</p>
      </header>
      <section className="admin-panel">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-emerald-950 dark:text-white">
              <UsersIcon className="h-5 w-5 text-green-500" />
              Usuarios inscritos
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(byRole).map(([role, count]) => (
              <span
                key={role}
                className={`rounded-full px-3 py-1 text-xs font-black ${ROLE_BADGES[role] ?? "bg-zinc-100 text-zinc-600"}`}
              >
                {role} · {count}
              </span>
            ))}
            <UsersToolbar teams={teams} />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl shadow-sm dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-green-100 bg-green-50/50 text-xs font-black uppercase tracking-wider text-zinc-500 dark:border-emerald-900 dark:bg-emerald-900/40 dark:text-zinc-400">
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Progreso</th>
                <th className="px-4 py-3">Recompensas</th>
                <th className="px-4 py-3">Registro</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-green-50 transition hover:bg-green-50/30 dark:border-emerald-900 dark:hover:bg-emerald-900/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={user.name}
                        src={user.avatarUrl}
                        config={parseAvatarConfig(user.avatarConfig)}
                        size={36}
                      />
                      <div>
                        <p className="font-black text-emerald-950 dark:text-white">
                          {user.name}
                          <span className="ml-2 font-mono text-[10px] font-bold text-zinc-400">
                            @{user.username}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleSelect
                      userId={user.id}
                      currentRole={user.role}
                      isProtected={PROTECTED_EMAILS.includes(user.email)}
                      viewerIsSuperadmin={viewerIsSuperadmin}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    {user._count.lessonsCompleted} lecciones · {user._count.gameSessions} juegos
                  </td>
                  <td className="px-4 py-3 text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    <span className="text-green-600 dark:text-green-400">{user.xp} XP</span> ·{" "}
                    <span className="text-amber-600">{user.coins} monedas</span> ·{" "}
                    <span className="text-purple-600">{user.trophies} trofeos</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {user.createdAt.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteUserButton userId={user.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-green-100 dark:border-emerald-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Mostrando {skip + 1}–{Math.min(skip + users.length, total)} de {total} usuarios
            </p>
            <nav className="flex items-center gap-1" aria-label="Paginación de usuarios">
              <Link
                href={`/admin/users?page=${safePage - 1}&pageSize=${safePageSize}`}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition ${
                  safePage === 1
                    ? "text-zinc-300 border-zinc-200 cursor-not-allowed dark:text-zinc-600 dark:border-zinc-700"
                    : "text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                }`}
                aria-label="Página anterior"
                aria-disabled={safePage === 1}
              >
                ← Anterior
              </Link>
              <div className="flex items-center gap-1">
                {pageNumbers.map((p) => (
                  <Link
                    key={p}
                    href={`/admin/users?page=${p}&pageSize=${safePageSize}`}
                    className={`px-3 py-1.5 text-sm font-bold rounded-lg ${
                      p === safePage
                        ? "bg-emerald-500 text-white dark:bg-emerald-600"
                        : "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                    }`}
                    aria-label={`Página ${p}`}
                    aria-current={p === safePage ? "page" : undefined}
                  >
                    {p}
                  </Link>
                ))}
              </div>
              <Link
                href={`/admin/users?page=${safePage + 1}&pageSize=${safePageSize}`}
                className={`px-3 py-1.5 text-sm font-bold rounded-lg border transition ${
                  safePage === totalPages
                    ? "text-zinc-300 border-zinc-200 cursor-not-allowed dark:text-zinc-600 dark:border-zinc-700"
                    : "text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
                }`}
                aria-label="Página siguiente"
                aria-disabled={safePage === totalPages}
              >
                Siguiente →
              </Link>
            </nav>
          </div>
        )}
      </div>
      </section>
    </article>
  );
}