import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CoachConfiguracionView,
  type CoachTeamData,
  type PlayerOption,
} from "@/components/admin/sections/coach-configuracion-view";

export const metadata = { title: "Configuración | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");

  // Equipo donde el coach figura como COACH
  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id, role: "COACH" },
    orderBy: { joinedAt: "asc" },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          code: true,
          logoUrl: true,
          members: {
            select: {
              userId: true,
              role: true,
              lineupPosition: true,
              user: {
                select: { id: true, name: true, username: true, avatarUrl: true, position: true },
              },
            },
          },
        },
      },
    },
  });

  let team: CoachTeamData;
  if (membership) {
    // Solo jugadores: el coach (COACH/capitán/owner) no cuenta en la alineación
    const playerMembers = membership.team.members.filter((m) => m.role === "PLAYER");
    team = {
      id: membership.team.id,
      name: membership.team.name,
      code: membership.team.code,
      logoUrl: membership.team.logoUrl,
      memberIds: playerMembers.map((m) => m.userId),
      members: playerMembers.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        position: m.user.position,
        lineupPosition: m.lineupPosition,
      })),
    };
  } else {
    team = { id: null, name: "", code: null, logoUrl: null, memberIds: [], members: [] };
  }

  // Jugadores disponibles para asignar (incluye los ya miembros)
  const players = await prisma.user.findMany({
    where: { role: "JUGADOR" },
    select: { id: true, name: true, username: true, avatarUrl: true, position: true },
    orderBy: { name: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <CoachConfiguracionView players={players as PlayerOption[]} team={team} />
    </div>
  );
}
