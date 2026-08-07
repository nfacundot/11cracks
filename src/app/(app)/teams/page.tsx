import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { TeamForm } from "@/components/team-form";
import { Avatar } from "@/components/avatar";
import { ShieldIcon, ChevronRightIcon } from "@/components/icons";

export const metadata = { title: "Equipos" };

export default async function TeamsPage() {
  const user = await requireUser();

  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          members: { include: { user: { select: { name: true, avatarUrl: true } } } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-black">Equipos</h1>
        <p className="text-sm text-zinc-500">
          Entrena en equipo y compite por XP
        </p>
      </header>

      {memberships.map((m) => (
        <Link
          key={m.teamId}
          href={`/team/${m.teamId}`}
          className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-green-100 transition hover:shadow-md"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-950 text-2xl text-white">
            {m.team.logoUrl ? (
              <Image
                src={m.team.logoUrl}
                alt=""
                width={56}
                height={56}
                unoptimized
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <ShieldIcon className="h-7 w-7" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-black">{m.team.name}</h2>
            <p className="text-xs font-bold text-zinc-400">
              {m.team.members.length} jugadores · {m.team.totalXp} XP
            </p>
            <div className="mt-1.5 flex -space-x-2">
              {m.team.members.slice(0, 4).map((member) => (
                <Avatar
                  key={member.id}
                  name={member.user.name}
                  src={member.user.avatarUrl}
                  size={24}
                  className="ring-2 ring-white"
                />
              ))}
              {m.team.members.length > 4 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-black text-zinc-500 ring-2 ring-white">
                  +{m.team.members.length - 4}
                </span>
              )}
            </div>
          </div>
          <ChevronRightIcon className="h-5 w-5 text-zinc-300 transition group-hover:translate-x-1 group-hover:text-green-500" />
        </Link>
      ))}

      <TeamForm />

      {memberships.length === 0 && (
        <p className="-mt-2 rounded-2xl bg-white p-4 text-center text-sm text-zinc-400 ring-1 ring-zinc-100">
          Crea tu equipo o únete con el código de un amigo ⚽
        </p>
      )}
    </div>
  );
}
