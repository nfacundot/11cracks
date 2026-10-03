import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          alignments: {
            where: { published: true },
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            select: { id: true, name: true, formation: true, positions: true, trazos: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ membership: null, members: [], alignments: [], currentId: null, meId: user.id });
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId: membership.teamId, role: "PLAYER" },
    orderBy: { joinedAt: "asc" },
    select: {
      userId: true,
      lineupPosition: true,
      user: { select: { id: true, name: true, username: true, avatarUrl: true, position: true } },
    },
  });

  const alignments = membership.team.alignments;

  return NextResponse.json({
    membership: { teamId: membership.teamId, teamName: membership.team.name },
    members: members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      position: m.user.position,
      lineupPosition: m.lineupPosition,
    })),
    alignments,
    currentId: alignments.length ? alignments[alignments.length - 1].id : null,
    meId: user.id,
  });
}
