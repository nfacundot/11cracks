import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNavigationForRole } from "@/lib/shell/navigation";
import { AppShell, type ShellUser } from "@/components/shell/app-shell";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSection("ENTRENADOR");

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id, role: "COACH" },
    orderBy: { joinedAt: "asc" },
    select: { team: { select: { name: true, logoUrl: true } } },
  });

  const shellUser: ShellUser = {
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    role: "coach",
  };

  return (
    <AppShell
      user={shellUser}
      groups={getNavigationForRole("coach")}
      clubLogo={membership ? membership.team.logoUrl : null}
      scopeLabel={membership ? membership.team.name : "Equipo"}
    >
      {children}
    </AppShell>
  );
}
