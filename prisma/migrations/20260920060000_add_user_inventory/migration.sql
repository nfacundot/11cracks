-- AlterTable
ALTER TABLE "User" ADD COLUMN     "inventory" JSONB NOT NULL DEFAULT '[]';
