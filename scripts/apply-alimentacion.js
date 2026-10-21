// Espejo en CommonJS de scripts/apply-alimentacion.ts.
// El paquete raiz no declara "type": "module", asi que este archivo usa
// import dinamico para no depender de require().
//
// "AlimentacionWord" ya forma parte del ledger de migraciones; este script
// queda como reparador idempotente que alinea bases viejas o incompletas con
// prisma/schema.prisma sin duplicar objetos ni perder filas.
(async () => {
  const dotenv = await import("dotenv");
  dotenv.default.config();
  const { Client } = await import("pg");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query(`ALTER TYPE "GameCategory" ADD VALUE IF NOT EXISTS 'ALIMENTACION';`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS "AlimentacionWord" (
      id TEXT NOT NULL,
      "gameId" TEXT,
      name TEXT NOT NULL,
      "imageUrl" TEXT NOT NULL,
      "audioUrl" TEXT,
      "useTts" BOOLEAN NOT NULL DEFAULT true,
      "ttsVoice" TEXT NOT NULL DEFAULT 'female',
      "isHealthy" BOOLEAN NOT NULL,
      language TEXT NOT NULL DEFAULT 'es',
      active BOOLEAN NOT NULL DEFAULT true,
      "order" INT NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "AlimentacionWord_pkey" PRIMARY KEY ("id")
    );
  `);

  await client.query(`ALTER TABLE "AlimentacionWord" ADD COLUMN IF NOT EXISTS "useTts" BOOLEAN NOT NULL DEFAULT true;`);
  await client.query(`ALTER TABLE "AlimentacionWord" ADD COLUMN IF NOT EXISTS "ttsVoice" TEXT NOT NULL DEFAULT 'female';`);

  // El datamodel no declara defaults para estos campos: se retiran los que
  // dejaba la tabla original creada con SQL crudo.
  await client.query(`ALTER TABLE "AlimentacionWord" ALTER COLUMN "id" DROP DEFAULT;`);
  await client.query(`ALTER TABLE "AlimentacionWord" ALTER COLUMN "isHealthy" DROP DEFAULT;`);
  await client.query(`ALTER TABLE "AlimentacionWord" ALTER COLUMN "updatedAt" DROP DEFAULT;`);

  await client.query(`CREATE INDEX IF NOT EXISTS "AlimentacionWord_active_order_idx" ON "AlimentacionWord" (active, "order");`);
  await client.query(`CREATE INDEX IF NOT EXISTS "AlimentacionWord_gameId_idx" ON "AlimentacionWord" ("gameId");`);

  // ON DELETE CASCADE, igual que OidoCrackWord / GolPalabraWord / LetrasCrackWord.
  await client.query(`ALTER TABLE "AlimentacionWord" DROP CONSTRAINT IF EXISTS "AlimentacionWord_gameId_fkey";`);
  await client.query(`ALTER TABLE "AlimentacionWord" ADD CONSTRAINT "AlimentacionWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"(id) ON DELETE CASCADE ON UPDATE CASCADE;`);

  console.log("AlimentacionWord alineada con prisma/schema.prisma.");
  await client.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
