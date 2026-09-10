import { PrismaClient } from './src/generated/prisma/client.js';

const prisma = new PrismaClient();

async function check() {
  const clases = await prisma.clase.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true,
      temas: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          order: true,
          lessons: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            select: { id: true, title: true, temaId: true },
          },
        },
      },
    },
  });
  
  console.log(JSON.stringify(clases, null, 2));
  await prisma.$disconnect();
}

check();