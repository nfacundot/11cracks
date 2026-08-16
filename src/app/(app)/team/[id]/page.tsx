import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { parseAvatarConfig } from "@/lib/avatar";
import { TeamActions } from "@/components/team-actions";
import { AddMemberForm } from "@/components/add-member-form";
import { ShieldIcon } from "@/components/icons";

export const metadata = { title: "Equipo" };

const roleLabel: Record<string, string> = {
  OWNER: "Capitán",
  COACH: "Coach",
  PLAYER: "Jugador",
};

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
              avatarConfig: true,
              xp: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
  });

  if (!team) notFound();

  const myMembership = team.members.find((m) => m.userId === user.id);
  if (!myMembership) notFound();

  const canManage = myMembership.role === "OWNER" || myMembership.role === "COACH";

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl bg-emerald-950 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
            {team.logoUrl ? (
              <Image
                src={team.logoUrl}
                alt=""
                width={64}
                height={64}
                unoptimized
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <ShieldIcon className="h-8 w-8" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">{team.name}</h1>
            <p className="text-sm text-green-200/70">
              {team.members.length} jugadores · {team.totalXp} XP
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-green-300">
              Código de invitación
            </p>
            <p className="font-mono text-lg font-black tracking-widest">{team.code}</p>
          </div>
          <TeamActions
            teamId={team.id}
            canLeave
            copyCode={team.code}
            roleLabel={roleLabel[myMembership.role]}
          />
        </div>

        {team.description && (
          <p className="mt-3 text-sm text-green-100/70">{team.description}</p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-black">Jugadores</h2>
        {canManage && <AddMemberForm teamId={team.id} />}
        {team.members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-2xl bg-white/60 backdrop-blur-xl p-4 shadow-sm ring-1 ring-green-100 dark:bg-emerald-950/60 dark:backdrop-blur-xl dark:ring-green-900"
          >
            <Avatar
              name={member.user.name}
              src={member.user.avatarUrl}
              config={parseAvatarConfig(member.user.avatarConfig)}
              size={44}
            />
            <div className="flex-1">
              <p className="font-black">
                {member.user.name}
                {member.user.id === user.id && (
                  <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500">(tú)</span>
                )}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                @{member.user.username} · {roleLabel[member.role]}
              </p>
            </div>
            <div className="text-right">
              <p className="font-black text-green-600 dark:text-green-400">{member.user.xp} XP</p>
              {canManage && member.userId !== user.id && (
                <TeamActions teamId={team.id} memberUserId={member.user.id} memberName={member.user.name} canRemove />
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
