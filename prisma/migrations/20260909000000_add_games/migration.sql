-- Modelo Game: catálogo de juegos con categoría (Oído, Gol, Letras)
CREATE TYPE "GameCategory" AS ENUM ('OIDO', 'GOL', 'LETRAS');

CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "GameCategory" NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎮',
    "color" TEXT NOT NULL DEFAULT '#22c55e',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");
CREATE INDEX "Game_category_active_order_idx" ON "Game"("category", "active", "order");
CREATE INDEX "Game_order_idx" ON "Game"("order");

-- Palabras vinculadas a un juego (cada juego guarda sus propias palabras)
ALTER TABLE "OidoCrackWord" ADD COLUMN "gameId" TEXT;
ALTER TABLE "GolPalabraWord" ADD COLUMN "gameId" TEXT;
ALTER TABLE "LetrasCrackWord" ADD COLUMN "gameId" TEXT;

CREATE INDEX "OidoCrackWord_gameId_idx" ON "OidoCrackWord"("gameId");
CREATE INDEX "GolPalabraWord_gameId_idx" ON "GolPalabraWord"("gameId");
CREATE INDEX "LetrasCrackWord_gameId_idx" ON "LetrasCrackWord"("gameId");

ALTER TABLE "OidoCrackWord" ADD CONSTRAINT "OidoCrackWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GolPalabraWord" ADD CONSTRAINT "GolPalabraWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LetrasCrackWord" ADD CONSTRAINT "LetrasCrackWord_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;