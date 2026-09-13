-- Add TYPING to LessonType (escuchar la palabra y escribirla).
CREATE TYPE "LessonType_new" AS ENUM ('LESSON', 'QUIZ', 'GAME', 'PREGUNTADOS', 'CONTRARRELOJ', 'SPEAKING', 'TYPING');

ALTER TABLE "Lesson" ALTER COLUMN "type" DROP DEFAULT;

ALTER TABLE "Lesson" ALTER COLUMN "type" TYPE "LessonType_new" USING ("type"::text::"LessonType_new");

ALTER TABLE "Lesson" ALTER COLUMN "type" SET DEFAULT 'LESSON';

DROP TYPE "LessonType";

ALTER TYPE "LessonType_new" RENAME TO "LessonType";
