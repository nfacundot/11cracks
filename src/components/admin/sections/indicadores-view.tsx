import { prisma } from "@/lib/prisma";
import { IndicatorManager } from "@/components/admin/indicator-manager";

export async function IndicadoresView() {
  const indicators = await prisma.indicator.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      percentage: true,
      userId: true,
      user: { select: { name: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <IndicatorManager indicators={indicators} />;
}
