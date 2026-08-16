import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ShieldIcon } from "@/components/icons";
import { Avatar } from "@/components/avatar";
import { parseAvatarConfig } from "@/lib/avatar";
import { DeleteTeamButton } from "@/components/admin/delete-team-button";

export const metadata = { title: "Equipos | Admin" };

export default async function AdminTeamsPage() {
  await requireAdmin();

  const teams = await prisma.team.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, username: true, avatarUrl: true, avatarConfig: true, role: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-black text-emerald-950 dark:text-white">
          <ShieldIcon className="h-6 w-6 text-purple-500" />
          Equipos
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Equipos creados en la app. El entrenador arma su grupo de estudiantes como un equipo de fútbol.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {teams.map((team) => {
          const captain = team.members.find((m) => m.role === "OWNER")?.user;
          const coaches = team.members.filter((m) => m.role === "COACH").map((m) => m.user);
          const players = team.members.filter((m) => m.role === "PLAYER").map((m) => m.user);

          return (
            <div
              key={team.id}
              className="rounded-2xl border border-green-100 bg-white/60 backdrop-blur-xl p-5 dark:border-emerald-900 dark:bg-emerald-950/60 dark:backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-2xl">
                    {team.logoUrl ? "🛡️" : "⚽"}
                  </span>
                  <div>
                    <h3 className="font-black text-emerald-950 dark:text-white">{team.name}</h3>
                    <p className="font-mono text-xs font-bold text-zinc-400">Código {team.code}</p>
                  </div>
                </div>
                <DeleteTeamButton id={team.id} />
              </div>

              {team.description && (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{team.description}</p>
              )}

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-green-50 p-2 dark:bg-emerald-900">
                  <p className="text-lg font-black text-green-600 dark:text-green-400">{team.members.length}</p>
                  <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Miembros</p>
                </div>
                <div className="rounded-xl bg-purple-50 p-2 dark:bg-emerald-900">
                  <p className="text-lg font-black text-purple-600">{players.length}</p>
                  <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Estudiantes</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-2 dark:bg-emerald-900">
                  <p className="text-lg font-black text-amber-600">{team.totalXp}</p>
                  <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">XP del equipo</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {captain && (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={captain.name}
                      src={captain.avatarUrl}
                      config={parseAvatarConfig(captain.avatarConfig)}
                      size={28}
                    />
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{captain.name}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-black text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      Capitán
                    </span>
                  </div>
                )}
                {coaches.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Avatar
                      name={c.name}
                      src={c.avatarUrl}
                      config={parseAvatarConfig(c.avatarConfig)}
                      size={28}
                    />
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{c.name}</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-black text-green-700 dark:bg-green-950 dark:text-green-400">
                      Entrenador
                    </span>
                  </div>
                ))}
                {players.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {players.map((p) => (
                      <span key={p.id} className="flex items-center gap-1 rounded-full bg-blue-50 py-0.5 pl-0.5 pr-2 dark:bg-blue-950/40">
                        <Avatar
                          name={p.name}
                          src={p.avatarUrl}
                          config={parseAvatarConfig(p.avatarConfig)}
                          size={20}
                        />
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">{p.name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {teams.length === 0 && (
        <div className="rounded-2xl border border-dashed border-green-200 p-10 text-center text-sm font-bold text-zinc-400 dark:border-emerald-800">
          Aún no hay equipos creados.
        </div>
      )}
    </div>
  );
}
