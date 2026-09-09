import { requireSection } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CoachDashboardView } from "@/components/admin/sections/coach-dashboard-view";

export const metadata = { title: "Inicio | Coach" };

export default async function Page() {
  const user = await requireSection("ENTRENADOR");

  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id, role: "COACH" },
    orderBy: { joinedAt: "asc" },
    select: {
      team: {
        select: {
          name: true,
          alignments: { where: { published: true }, select: { id: true }, take: 1 },
        },
      },
    },
  });

  return (
    <div>
      <CoachDashboardView
        clubName={membership?.team.name ?? "Forjadores Pro"}
        publicado={Boolean(membership?.team.alignments.length)}
      />
    </div>
  );
}