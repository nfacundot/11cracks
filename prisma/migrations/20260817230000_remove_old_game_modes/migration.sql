-- Create new enum with only the values we keep
CREATE TYPE "GameMode_new" AS ENUM ('ANAGRAM', 'INFOGRAMA');

-- Update Lesson table to use new enum, casting existing values
-- Values that don't match the new enum will be set to null
UPDATE "Lesson" SET "gameMode" = NULL WHERE "gameMode" NOT IN ('ANAGRAM', 'INFOGRAMA');

ALTER TABLE "Lesson" ALTER COLUMN "gameMode" DROP DEFAULT;
ALTER TABLE "Lesson" ALTER COLUMN "gameMode" TYPE "GameMode_new" USING "gameMode"::text::"GameMode_new";

-- Drop old enum and rename new one
DROP TYPE "GameMode";
ALTER TYPE "GameMode_new" RENAME TO "GameMode";
