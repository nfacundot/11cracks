-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calendarEvents" JSONB NOT NULL DEFAULT '[]';
