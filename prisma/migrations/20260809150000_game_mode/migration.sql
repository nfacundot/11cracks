-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('PENALTY', 'MEMORY', 'QUIZ', 'SPRINT', 'SETBACKS');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "gameMode" "GameMode";
