-- Add SPEAKING to LessonType and speaking answers to AnswerRecord.
CREATE TYPE "LessonType_new" AS ENUM ('LESSON', 'QUIZ', 'GAME', 'PREGUNTADOS', 'CONTRARRELOJ', 'SPEAKING');

ALTER TABLE "Lesson" ALTER COLUMN "type" DROP DEFAULT;

ALTER TABLE "Lesson" ALTER COLUMN "type" TYPE "LessonType_new" USING ("type"::text::"LessonType_new");

ALTER TABLE "Lesson" ALTER COLUMN "type" SET DEFAULT 'LESSON';

DROP TYPE "LessonType";

ALTER TYPE "LessonType_new" RENAME TO "LessonType";

ALTER TABLE "AnswerRecord" ADD COLUMN "answerText" TEXT;
ALTER TABLE "AnswerRecord" ADD COLUMN "score" INTEGER;