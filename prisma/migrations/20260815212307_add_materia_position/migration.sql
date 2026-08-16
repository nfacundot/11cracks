-- AlterTable
ALTER TABLE "Materia" ADD COLUMN     "posX" DOUBLE PRECISION NOT NULL DEFAULT 50,
ADD COLUMN     "posY" DOUBLE PRECISION NOT NULL DEFAULT 50;

-- Backfill positions for assigned materias (serpentine along the camino)
UPDATE "Materia"
SET
  "posX" = CASE
    WHEN ("order" / 3) % 2 = 0 THEN 20 + 30 * ("order" % 3)
    ELSE 80 - 30 * ("order" % 3)
  END,
  "posY" = 10 + 24 * ("order" / 3)
WHERE "etapaId" IS NOT NULL;
