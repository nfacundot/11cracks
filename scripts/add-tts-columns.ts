import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" ADD COLUMN IF NOT EXISTS "useTts" BOOLEAN NOT NULL DEFAULT true;`;
  await prisma.$executeRaw`ALTER TABLE "AlimentacionWord" ADD COLUMN IF NOT EXISTS "ttsVoice" TEXT NOT NULL DEFAULT 'female';`;
  console.log('TTS columns added');
  await prisma.$disconnect();
}

main().catch(console.error);