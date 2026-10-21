// Utilidad CLI: imprime el id del administrador.
// El paquete raiz no declara "type": "module", asi que este archivo es CommonJS
// y usa import dinamico para no depender de require().
(async () => {
  const dotenv = await import("dotenv");
  dotenv.default.config();
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("./src/generated/prisma/client.js");

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({ where: { email: "admin@11cracks.com" } });
  console.log(user?.id);
  await prisma.$disconnect();
})();
