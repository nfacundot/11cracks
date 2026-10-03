-- CreateTable
CREATE TABLE "Trophy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '🏆',
    "metric" TEXT NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trophy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrophy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trophyId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTrophy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trophy_active_order_idx" ON "Trophy"("active", "order");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrophy_userId_trophyId_key" ON "UserTrophy"("userId", "trophyId");

-- CreateIndex
CREATE INDEX "UserTrophy_userId_idx" ON "UserTrophy"("userId");

-- AddForeignKey
ALTER TABLE "UserTrophy" ADD CONSTRAINT "UserTrophy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrophy" ADD CONSTRAINT "UserTrophy_trophyId_fkey" FOREIGN KEY ("trophyId") REFERENCES "Trophy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed demo trophies
INSERT INTO "Trophy" ("id","name","subtitle","description","icon","metric","target","order","active","createdAt","updatedAt") VALUES
('trofeo-impacto','Impacto','Jugador que suma','Participación en el ecosistema','🌍','impact',1,1,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('trofeo-constancia','Constancia','Presencia constante','Sesiones asistidas','🔥','sessions',20,2,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('trofeo-recorrido','Recorrido','Camino de 540 horas','Horas validadas','🛣️','hours',540,3,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('trofeo-deporte','Deporte','Ritmo de entrenamiento','Días activos del período','⚽','activeDays',5,4,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
