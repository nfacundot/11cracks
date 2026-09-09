import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRaw`ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'PREGUNTADOS';`;
  await prisma.$executeRaw`ALTER TYPE "LessonType" ADD VALUE IF NOT EXISTS 'CONTRARRELOJ';`;
  console.log("✔ Valores PREGUNTADOS / CONTRARRELOJ agregados al enum LessonType.");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});