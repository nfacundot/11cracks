-- 1. Remove TRAINING from LessonType enum
UPDATE "Lesson" SET "type" = 'LESSON' WHERE "type"::text = 'TRAINING';
ALTER TABLE "Lesson" ALTER COLUMN "type" DROP DEFAULT;
CREATE TYPE "LessonType_new" AS ENUM ('LESSON', 'QUIZ', 'GAME');
ALTER TABLE "Lesson" ALTER COLUMN "type" TYPE "LessonType_new" USING "type"::text::"LessonType_new";
ALTER TABLE "Lesson" ALTER COLUMN "type" SET DEFAULT 'LESSON';
DROP TYPE "LessonType";
ALTER TYPE "LessonType_new" RENAME TO "LessonType";

-- 2. Rename Etapa table to Clase
ALTER TABLE "Etapa" RENAME TO "Clase";

-- 3. Rename Materia table to Tema
ALTER TABLE "Materia" RENAME TO "Tema";

-- 4. Rename foreign key columns in Tema (was Materia)
ALTER TABLE "Tema" RENAME COLUMN "etapaId" TO "claseId";

-- 5. Rename foreign key column in Lesson
ALTER TABLE "Lesson" RENAME COLUMN "materiaId" TO "temaId";

-- 6. Rename indexes
ALTER INDEX IF EXISTS "Materia_etapaId_order_idx" RENAME TO "Tema_claseId_order_idx";
ALTER INDEX IF EXISTS "Materia_order_idx" RENAME TO "Tema_order_idx";
ALTER INDEX IF EXISTS "Lesson_materiaId_order_idx" RENAME TO "Lesson_temaId_order_idx";
