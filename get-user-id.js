const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const user = await prisma.user.findUnique({ where: { email: 'admin@11cracks.com' } });
console.log(user?.id);
await prisma.$disconnect();