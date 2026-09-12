-- CreateEnum
CREATE TYPE "VideoCategory" AS ENUM ('PARA_MI', 'ENTRENAMIENTO', 'NEUROCRACKS');

-- CreateEnum
CREATE TYPE "VideoSourceType" AS ENUM ('URL', 'FILE');

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "VideoCategory" NOT NULL,
    "sourceType" "VideoSourceType" NOT NULL DEFAULT 'URL',
    "url" TEXT,
    "filePath" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoProgress" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Video_category_idx" ON "Video"("category");

-- CreateIndex
CREATE INDEX "VideoProgress_playerId_idx" ON "VideoProgress"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoProgress_videoId_playerId_key" ON "VideoProgress"("videoId", "playerId");

-- AddForeignKey
ALTER TABLE "VideoProgress" ADD CONSTRAINT "VideoProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;