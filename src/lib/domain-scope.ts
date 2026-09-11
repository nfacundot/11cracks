import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export interface EvaluationScope {
  clubId: string;
  clubName: string;
  playerIds: string[];
}

function requireEvaluatorOrStaff(user: SessionUser): void {
  if (user.role === "JUGADOR") {
    throw new Error("Un jugador no puede administrar datos de equipo.");
  }
}

export async function scopesFor(user: SessionUser): Promise<EvaluationScope[]> {
  requireEvaluatorOrStaff(user);

  if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        name: true,
        members: { where: { role: "PLAYER" }, select: { userId: true } },
      },
    });
    return teams.map((team) => ({
      clubId: team.id,
      clubName: team.name,
      playerIds: team.members.map((member) => member.userId),
    }));
  }

  const memberships = await prisma.teamMember.findMany({
    where: {
      userId: user.id,
      role: { in: ["COACH", "OWNER"] },
    },
    select: {
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          members: { where: { role: "PLAYER" }, select: { userId: true } },
        },
      },
    },
  });

  return memberships.map((membership) => ({
    clubId: membership.team.id,
    clubName: membership.team.name,
    playerIds: membership.team.members.map((member) => member.userId),
  }));
}

export async function assertInScope(
  user: SessionUser,
  clubId: string,
  playerId?: string,
  permission = "administrar este club"
): Promise<EvaluationScope> {
  requireEvaluatorOrStaff(user);
  if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
    return { clubId, clubName: "", playerIds: [] };
  }
  const scopes = await scopesFor(user);
  const scope = scopes.find((item) => item.clubId === clubId);
  if (!scope) {
    throw new Error(`Fuera de scope: no puedes ${permission}.`);
  }
  if (playerId && !scope.playerIds.includes(playerId)) {
    throw new Error("Fuera de scope: este jugador no pertenece a tu equipo.");
  }
  return scope;
}