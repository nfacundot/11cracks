import { prisma } from "@/lib/prisma";
import { CharacteristicManager } from "@/components/admin/characteristic-manager";

export async function CaracteristicasView() {
  const characteristics = await prisma.characteristic.findMany({
    select: {
      id: true,
      name: true,
      percentage: true,
      color: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <CharacteristicManager characteristics={characteristics} />;
}
