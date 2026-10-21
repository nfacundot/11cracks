-- Alinea la base de datos con prisma/schema.prisma.
--
-- "AlimentacionWord" se creo con SQL crudo desde scripts/apply-alimentacion.ts
-- y quedo fuera del ledger de migraciones, por eso su definicion diverjia del
-- datamodel: defaults a nivel de base (gen_random_uuid / true / now()) y una
-- FK hacia "Game" con ON DELETE SET NULL en lugar de CASCADE.
-- "Lesson.gameId" nunca recibio su FK, aunque el datamodel la declara con
-- onDelete: SetNull.
--
-- Solo DDL: no se elimina ni modifica ninguna fila.

-- DropForeignKey
ALTER TABLE "AlimentacionWord" DROP CONSTRAINT "AlimentacionWord_gameId_fkey";

-- AlterTable
ALTER TABLE "AlimentacionWord" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "isHealthy" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlimentacionWord" ADD CONSTRAINT "AlimentacionWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
