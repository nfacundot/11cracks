-- Invierte la jerarquía: Subject (Materia) -> Etapa, Stage (Etapa) -> Materia
-- La jerarquía de datos se conserva: Etapa agrupa Materias y cada Materia conserva sus Lecciones.

-- AlterEnum
ALTER TYPE "GameMode" ADD VALUE 'ANAGRAM';

-- RenameTables
ALTER TABLE "Subject" RENAME TO "Etapa";
ALTER TABLE "Stage" RENAME TO "Materia";

-- RenameColumns
ALTER TABLE "Materia" RENAME COLUMN "subjectId" TO "etapaId";
ALTER TABLE "Materia" RENAME COLUMN "title" TO "name";
ALTER TABLE "Lesson" RENAME COLUMN "stageId" TO "materiaId";

-- AlterTable
ALTER TABLE "Etapa" ALTER COLUMN "emoji" SET DEFAULT '🗺️';

-- RenameIndex
ALTER INDEX "Subject_pkey" RENAME TO "Etapa_pkey";
ALTER INDEX "Subject_order_idx" RENAME TO "Etapa_order_idx";

-- RenameIndex
ALTER INDEX "Stage_pkey" RENAME TO "Materia_pkey";
ALTER INDEX "Stage_order_idx" RENAME TO "Materia_order_idx";
ALTER INDEX "Stage_subjectId_order_idx" RENAME TO "Materia_etapaId_order_idx";

-- RenameIndex
ALTER INDEX "Lesson_stageId_order_idx" RENAME TO "Lesson_materiaId_order_idx";

-- RenameForeignKey
ALTER TABLE "Materia" RENAME CONSTRAINT "Stage_subjectId_fkey" TO "Materia_etapaId_fkey";
ALTER TABLE "Lesson" RENAME CONSTRAINT "Lesson_stageId_fkey" TO "Lesson_materiaId_fkey";
