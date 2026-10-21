import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Vincula cada Juego con su leccion "GAME".
 *
 * La columna y la FK las crea el ledger de migraciones; aqui solo se
 * comprueban. El indice UNIQUE sobre "Lesson"."gameId" ya no aplica: la
 * migracion 20260911120000_allow_multiple_lessons_per_game lo elimino para
 * permitir varias lecciones por juego, asi que no debe volver a crearse.
 */
async function main() {
  await prisma.$executeRaw`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "gameId" TEXT;`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Lesson_gameId_idx" ON "Lesson" ("gameId");`;

  const games = await prisma.game.findMany({
    orderBy: { order: "asc" },
    select: { id: true, slug: true, name: true, emoji: true, color: true, description: true },
  });

  for (const game of games) {
    const lesson = await prisma.lesson.findFirst({ where: { gameId: game.id }, select: { id: true } });
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
      console.log(`✔ Lección creada: ${game.name} (${game.slug}) -> lesson ${created.id}`);
    } else {
      console.log(`✔ Lección vinculada: ${game.name} (${game.slug}) -> lesson ${lesson.id}`);
    }
  }

  console.log(`Vinculación completada (${games.length} juegos).`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
