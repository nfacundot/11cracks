import { PrismaClient } from './src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const user = await prisma.user.findUnique({ where: { email: 'admin@11cracks.com' } });
console.log(user?.id);
await prisma.$disconnect();