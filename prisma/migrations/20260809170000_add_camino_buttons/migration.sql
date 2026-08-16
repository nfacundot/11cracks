-- CreateTable
CREATE TABLE "CaminoButton" (
    "id" TEXT NOT NULL,
    "etapaId" TEXT NOT NULL,
    "lessonId" TEXT,
    "title" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '⚽',
    "color" TEXT NOT NULL DEFAULT '#16a34a',
    "posX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "posY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CaminoButton_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaminoButton_etapaId_order_key" ON "CaminoButton"("etapaId", "order");

-- CreateIndex
CREATE INDEX "CaminoButton_etapaId_idx" ON "CaminoButton"("etapaId");

-- AddForeignKey
ALTER TABLE "CaminoButton" ADD CONSTRAINT "CaminoButton_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "Etapa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaminoButton" ADD CONSTRAINT "CaminoButton_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
