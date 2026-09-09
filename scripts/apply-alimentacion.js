const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('ALTER TYPE "GameCategory" ADD VALUE IF NOT EXISTS \'ALIMENTACION\';');
  await client.query('CREATE TABLE IF NOT EXISTS "AlimentacionWord" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), "gameId" TEXT, name TEXT NOT NULL, "imageUrl" TEXT NOT NULL, "audioUrl" TEXT, "isHealthy" BOOLEAN NOT NULL DEFAULT true, language TEXT NOT NULL DEFAULT \'es\', active BOOLEAN NOT NULL DEFAULT true, "order" INT NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now());');
  await client.query('CREATE INDEX IF NOT EXISTS "AlimentacionWord_active_order_idx" ON "AlimentacionWord" (active, "order");');
  await client.query('CREATE INDEX IF NOT EXISTS "AlimentacionWord_gameId_idx" ON "AlimentacionWord" ("gameId");');
  await client.query('ALTER TABLE "AlimentacionWord" ADD CONSTRAINT "AlimentacionWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"(id) ON DELETE SET NULL ON UPDATE CASCADE;');
  console.log('Done');
  await client.end();
}

main().catch(console.error);