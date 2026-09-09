-- Configuración de Oído de Crack: palabras y opciones-imagen
CREATE TABLE "OidoCrackWord" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "label" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OidoCrackWord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OidoCrackOption" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OidoCrackOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OidoCrackWord_active_order_idx" ON "OidoCrackWord"("active", "order");

CREATE INDEX "OidoCrackOption_wordId_idx" ON "OidoCrackOption"("wordId");

ALTER TABLE "OidoCrackOption" ADD CONSTRAINT "OidoCrackOption_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "OidoCrackWord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
