import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRaw`ALTER TYPE "GameCategory" ADD VALUE IF NOT EXISTS 'ALIMENTACION';`;
  
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "AlimentacionWord" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "gameId" TEXT,
      name TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL,
      "audioUrl" TEXT,
      "isHealthy" BOOLEAN NOT NULL DEFAULT true,
      language TEXT NOT NULL DEFAULT 'es',
      active BOOLEAN NOT NULL DEFAULT true,
      "order" INT NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
    );
  `;
  
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "AlimentacionWord_active_order_idx" ON "AlimentacionWord" (active, "order");`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "AlimentacionWord_gameId_idx" ON "AlimentacionWord" ("gameId");`;
  
  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" ADD CONSTRAINT "AlimentacionWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"(id) ON DELETE SET NULL ON UPDATE CASCADE;`;
  
  console.log('Done');
  await prisma.$disconnect();
}

main().catch(console.error);