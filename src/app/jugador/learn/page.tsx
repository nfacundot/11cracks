import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LearnClient } from "@/components/learn-client";

export const metadata = { title: "Mi Progreso" };

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadministrador",
  ADMIN: "Administrador",
  ENTRENADOR: "Entrenador",
  JUGADOR: "Jugador",
};

export default async function LearnPage() {
  const user = await requireUser();

  const [characteristics, indicators] = await Promise.all([
    prisma.characteristic.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, percentage: true },
    }),
    prisma.indicator.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, category: true, percentage: true },
    }),
  ]);

  return (
    <LearnClient
      userName={user.name}
      userUsername={user.username}
      avatarUrl={user.avatarUrl ?? null}
      userRole={ROLE_LABELS[user.role] ?? user.role}
      characteristics={characteristics}
      indicators={indicators}
    />
  );
}