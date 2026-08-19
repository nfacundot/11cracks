import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { IndicatorManager } from "@/components/admin/indicator-manager";

export const metadata = { title: "Indicadores | Admin" };

export default async function AdminIndicatorsPage() {
  await requireAdmin();

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
