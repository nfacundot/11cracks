import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { LearnClient } from "@/components/learn-client";

export const metadata = { title: "Aprender" };

export default async function LearnPage() {
  const user = await requireUser();

  const indicators = await prisma.indicator.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, percentage: true },
  });

  return (
    <LearnClient
      userName={user.name}
      userUsername={user.username}
      indicators={indicators}
    />
  );
}
