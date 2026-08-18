import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LearnClient } from "@/components/learn-client";

export const metadata = { title: "Aprender" };

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Jugador",
  ADMIN: "Administrador",
  COACH: "Entrenador",
  PARENT: "Padre / Madre",
};

export default async function LearnPage() {
  const user = await requireUser();

  const indicators = await prisma.indicator.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, percentage: true },
  });

  return (
    <LearnClient
      userName={user.name}
      userUsername={user.username}
      avatarUrl={user.avatarUrl ?? null}
      userRole={ROLE_LABELS[user.role] ?? user.role}
      indicators={indicators}
    />
  );
}
