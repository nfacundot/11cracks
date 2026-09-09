import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminWorkspace } from "@/components/admin-demo/admin-workspace";
import { adminIdentity } from "@/lib/admin-demo/state";

export const metadata = { title: "Clubes | Admin" };

export default async function DemoClubsPage() {
  await requireSection("ADMIN");

  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      members: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  const clubs = teams.map((team) => ({
    id: team.id,
    name: team.name,
    code: team.code,
    description: team.description ?? "",
    players: team.members.filter((m) => m.role === "PLAYER").length,
    coaches: team.members.filter((m) => m.role === "COACH").length,
    logoUrl: team.logoUrl,
    logoAlt: team.name,
    accent: team.code.toLowerCase(),
    status: "active" as const,
    responsibleNames: team.members.map((m) => m.user.name),
  }));

  return <AdminWorkspace identity={adminIdentity} section="clubs" clubs={clubs} />;
}
