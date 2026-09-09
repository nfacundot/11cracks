import { prisma } from "@/lib/prisma";
import { EtapasViewClient } from "@/components/admin/sections/etapas-view-client";

export async function EtapasView({ basePath }: { basePath: string }) {
  const [clases, allTemas] = await Promise.all([
    prisma.clase.findMany({
      orderBy: { order: "asc" },
      include: {
        temas: {
          orderBy: { order: "asc" },
          include: { _count: { select: { lessons: true } } },
        },
      },
    }),
    prisma.tema.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, emoji: true, color: true },
    }),
  ]);

  return <EtapasViewClient basePath={basePath} clases={clases} allTemas={allTemas} />;
}