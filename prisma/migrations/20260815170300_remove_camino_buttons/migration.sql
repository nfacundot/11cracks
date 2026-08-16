/*
  Warnings:

  - You are about to drop the `CaminoButton` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CaminoButton" DROP CONSTRAINT "CaminoButton_etapaId_fkey";

-- DropForeignKey
ALTER TABLE "CaminoButton" DROP CONSTRAINT "CaminoButton_lessonId_fkey";

-- DropTable
DROP TABLE "CaminoButton";
