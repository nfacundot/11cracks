import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CanchaView } from "@/components/admin/sections/cancha-view";

export const metadata = { title: "Cancha | Coach" };

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
          members: {
            select: {
              userId: true,
              role: true,
              lineupPosition: true,
              user: {
                select: { id: true, name: true, username: true, avatarUrl: true },
              },
            },
          },
          alignments: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              formation: true,
              published: true,
              positions: true,
              trazos: true,
            },
          },
        },
      },
    },
  });

  const players = membership
    ? membership.team.members
        .filter((m) => m.role === "PLAYER")
        .map((m) => ({
          id: m.user.id,
          name: m.user.name,
          username: m.user.username,
          avatarUrl: m.user.avatarUrl,
          lineupPosition: m.lineupPosition,
        }))
    : [];

  const alignmentList = (membership?.team.alignments ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    formation: a.formation,
    published: a.published,
  }));

  const current = membership?.team.alignments.find((a) => a.published) ?? membership?.team.alignments[0] ?? null;

  return (
    <div className="space-y-6">
      <CanchaView
        teamId={membership?.team.id ?? null}
        teamName={membership?.team.name ?? null}
        players={players}
        alignments={alignmentList}
        initialAlignmentId={current?.id ?? null}
        initialFormation={current?.formation ?? "4-3-3"}
        initialPositions={(current?.positions as Record<string, { x: number; y: number }>) ?? null}
        initialTrazos={(current?.trazos as { color: string; width: number; alpha: number; puntos: { x: number; y: number }[] }[]) ?? []}
      />
    </div>
  );
}
