import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNavigationForRole } from "@/lib/shell/navigation";
import { AppShell, type ShellUser } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSection("JUGADOR");

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    orderBy: { joinedAt: "asc" },
    select: { team: { select: { name: true, logoUrl: true } } },
  });

  const shellUser: ShellUser = {
    name: user.name,
    username: user.username,
    avatarUrl: user.avatarUrl,
    role: "player",
  };

  return (
    <AppShell
      user={shellUser}
      groups={getNavigationForRole("player")}
      clubLogo={membership?.team.logoUrl ?? null}
      scopeLabel={membership?.team.name ?? "Mi recorrido"}
    >
      {children}
    </AppShell>
  );
}
