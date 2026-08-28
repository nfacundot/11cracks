import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipoView, type TeamMemberData } from "@/components/admin/sections/equipo-view";

export const metadata = { title: "Equipo | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id, role: "COACH" },
    orderBy: { joinedAt: "asc" },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          logoUrl: true,
          members: {
            where: { role: "PLAYER" },
            select: {
              id: true,
              lineupPosition: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatarUrl: true,
                  avatarConfig: true,
                  xp: true,
                  currentStreak: true,
                  bestStreak: true,
                  bio: true,
                },
              },
            },
            orderBy: { lineupPosition: "asc" },
          },
        },
      },
    },
  });

  const teamName = membership?.team?.name ?? "";
  const members: TeamMemberData[] = membership
    ? membership.team.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        avatarConfig: m.user.avatarConfig as Record<string, unknown> | null,
        lineupPosition: m.lineupPosition,
        xp: m.user.xp,
        currentStreak: m.user.currentStreak,
        bestStreak: m.user.bestStreak,
        bio: m.user.bio,
      }))
    : [];

  return (
    <div className="space-y-6">
      <EquipoView teamName={teamName} members={members} />
    </div>
  );
}