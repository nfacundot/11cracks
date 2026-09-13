import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const [users, teams, lessons] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.lesson.count(),
  ]);

  const roles = await prisma.user.groupBy({ by: ["role"], _count: true });
  const players = await prisma.user.findMany({
    where: { role: "JUGADOR" },
    select: { email: true, username: true },
    take: 3,
  });

  console.log(JSON.stringify({ users, teams, lessons, roles, playersSample: players }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("DB CHECK FAILED:", error.message);
  process.exit(1);
});
