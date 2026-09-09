import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganizationUsersExperience } from "@/components/admin-demo/organization-users";

export const metadata = { title: "Usuarios y membresías | Admin" };

export default async function AdminOrganizationUsersPage() {
  await requireSection("ADMIN");

  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        teamMembers: { select: { teamId: true } },
      },
    }),
    prisma.team.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const organizationUsers = users.map((user) => ({
    personId: user.id,
    displayName: user.name,
    roles: (user.role === "JUGADOR" ? ["player"] : user.role === "ENTRENADOR" ? ["coach"] : []) as ("player" | "coach")[],
    accounts: [{ email: user.email }],
    accessStatus: "active" as const,
    clubId: user.teamMembers[0]?.teamId,
    teamId: user.teamMembers[0]?.teamId,
    hasPlayerProfile: Boolean(user.position),
  }));

  const clubs = teams.map((team) => ({ clubId: team.id, name: team.name }));
  const organizationTeams = teams.map((team) => ({ teamId: team.id, name: team.name }));

  return (
    <OrganizationUsersExperience
      users={organizationUsers}
      clubs={clubs}
      teams={organizationTeams}
    />
  );
}