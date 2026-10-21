import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * "AlimentacionWord" ya forma parte del ledger de migraciones
 * (prisma/migrations/20260909000000_add_games + 20260921000000_add_trophies
 * y la correctiva 20261021000000_sync_game_foreign_keys).
 *
 * Este script queda como reparador idempotente: alinea bases viejas o
 * incompletas con prisma/schema.prisma sin duplicar objetos ni perder filas.
 */
async function main() {
  await prisma.$executeRaw`ALTER TYPE "GameCategory" ADD VALUE IF NOT EXISTS 'ALIMENTACION';`;

  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "AlimentacionWord" (
      id TEXT NOT NULL,
      "gameId" TEXT,
      name TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL,
      "audioUrl" TEXT,
      "useTts" BOOLEAN NOT NULL DEFAULT true,
      "ttsVoice" TEXT NOT NULL DEFAULT 'female',
      "isHealthy" BOOLEAN NOT NULL,
      language TEXT NOT NULL DEFAULT 'es',
      active BOOLEAN NOT NULL DEFAULT true,
      "order" INT NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "AlimentacionWord_pkey" PRIMARY KEY ("id")
    );
  `;

  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" ADD COLUMN IF NOT EXISTS "useTts" BOOLEAN NOT NULL DEFAULT true;`;
  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" ADD COLUMN IF NOT EXISTS "ttsVoice" TEXT NOT NULL DEFAULT 'female';`;

  // El datamodel no declara defaults para estos campos: se retiran los que
  // dejaba la tabla original creada con SQL crudo.
  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" ALTER COLUMN "id" DROP DEFAULT;`;
  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" ALTER COLUMN "isHealthy" DROP DEFAULT;`;
  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" ALTER COLUMN "updatedAt" DROP DEFAULT;`;

  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "AlimentacionWord_active_order_idx" ON "AlimentacionWord" (active, "order");`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "AlimentacionWord_gameId_idx" ON "AlimentacionWord" ("gameId");`;

  // ON DELETE CASCADE, igual que OidoCrackWord / GolPalabraWord / LetrasCrackWord.
  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" DROP CONSTRAINT IF EXISTS "AlimentacionWord_gameId_fkey";`;
  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" ADD CONSTRAINT "AlimentacionWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"(id) ON DELETE CASCADE ON UPDATE CASCADE;`;

  console.log("AlimentacionWord alineada con prisma/schema.prisma.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
