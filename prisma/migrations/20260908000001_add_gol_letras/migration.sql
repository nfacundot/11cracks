-- Configuración de Gol de Palabra y Letras de Crack
CREATE TABLE "GolPalabraWord" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GolPalabraWord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GolPalabraOption" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GolPalabraOption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LetrasCrackWord" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "letters" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LetrasCrackWord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GolPalabraWord_active_order_idx" ON "GolPalabraWord"("active", "order");

CREATE INDEX "GolPalabraOption_wordId_idx" ON "GolPalabraOption"("wordId");

CREATE INDEX "LetrasCrackWord_active_order_idx" ON "LetrasCrackWord"("active", "order");

ALTER TABLE "GolPalabraOption" ADD CONSTRAINT "GolPalabraOption_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "GolPalabraWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;