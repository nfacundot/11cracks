import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// La clave del singleton cambia cuando se regenera el cliente (p. ej. tras
// `prisma generate`), para que el dev server no reutilice un cliente antiguo.
const CACHE_KEY = "prismaClient";

export const prisma = globalForPrisma[CACHE_KEY] ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma[CACHE_KEY] = prisma;
}

