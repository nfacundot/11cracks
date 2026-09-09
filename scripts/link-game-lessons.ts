import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRaw`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "gameId" TEXT;`;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_gameId_key" ON "Lesson"("gameId") WHERE "gameId" IS NOT NULL;`;

  const games = await prisma.game.findMany({
    orderBy: { order: "asc" },
    select: { id: true, slug: true, name: true, emoji: true, color: true, description: true },
  });

  const lessonIdByGame = new Map<string, string>();
  for (const game of games) {
    let lesson = await prisma.lesson.findFirst({ where: { gameId: game.id }, select: { id: true } });
    if (!lesson) {
      const created = await prisma.lesson.create({
        data: {
          title: game.name,
          description: game.description ?? `Juego vinculado a la lección "${game.name}".`,
          emoji: game.emoji,
          color: game.color,
          type: "GAME",
          xpReward: 25,
          order: 100,
          gameId: game.id,
        },
        select: { id: true },
      });
      lesson = created;
    }
    lessonIdByGame.set(game.id, lesson.id);
    console.log(`✔ Lección vinculada: ${game.name} (${game.slug}) -> lesson ${lesson.id}`);
  }

  console.log(`Vinculación completada (${games.length} juegos).`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});