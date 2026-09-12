-- Allow one Game/category to be reused by multiple El Camino lessons.
DROP INDEX IF EXISTS "Lesson_gameId_key";

CREATE INDEX IF NOT EXISTS "Lesson_gameId_idx" ON "Lesson"("gameId");