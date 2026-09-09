import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRaw`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "optionMode" TEXT NOT NULL DEFAULT 'TEXT';`;
  await prisma.$executeRaw`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "timeSeconds" INTEGER;`;
  await prisma.$executeRaw`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OptionMode') THEN
      CREATE TYPE "OptionMode" AS ENUM ('TEXT', 'IMAGE', 'BOTH');
    END IF;
  END $$;`;
  await prisma.$executeRaw`ALTER TABLE "Lesson" ALTER COLUMN "optionMode" DROP DEFAULT;`;
  await prisma.$executeRaw`ALTER TABLE "Lesson" ALTER COLUMN "optionMode" TYPE "OptionMode" USING ("optionMode"::text::"OptionMode");`;
  await prisma.$executeRaw`ALTER TABLE "Lesson" ALTER COLUMN "optionMode" SET DEFAULT 'TEXT';`;
  console.log("✔ Columnas optionMode / timeSeconds añadidas y migradas a enum OptionMode.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});