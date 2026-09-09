import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

export type EtapaLayoutMap = {
  temas: Map<string, { posX: number; posY: number }>;
  lessons: Map<string, { posX: number; posY: number }>;
};

export async function getEtapaLayouts(claseIds: string[]): Promise<Map<string, EtapaLayoutMap>> {
  const result = new Map<string, EtapaLayoutMap>();
  for (const id of claseIds) {
    result.set(id, { temas: new Map(), lessons: new Map() });
  }
  if (claseIds.length === 0) return result;

  const [temas, lessons] = await Promise.all([
    prisma.etapaTema.findMany({
      where: { claseId: { in: claseIds } },
      select: { claseId: true, temaId: true, posX: true, posY: true },
    }),
    prisma.etapaLesson.findMany({
      where: { claseId: { in: claseIds } },
      select: { claseId: true, lessonId: true, posX: true, posY: true },
    }),
  ]);

  for (const t of temas) {
    const entry = result.get(t.claseId);
    if (entry) entry.temas.set(t.temaId, { posX: t.posX, posY: t.posY });
  }
  for (const l of lessons) {
    const entry = result.get(l.claseId);
    if (entry) entry.lessons.set(l.lessonId, { posX: l.posX, posY: l.posY });
  }
  return result;
}