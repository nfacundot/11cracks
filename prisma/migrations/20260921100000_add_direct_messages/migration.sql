-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DirectMessage_senderId_recipientId_createdAt_idx" ON "DirectMessage"("senderId", "recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_recipientId_read_idx" ON "DirectMessage"("recipientId", "read");

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Demo world players (password: demo1234)
INSERT INTO "User" ("id","email","password","name","username","role","avatarConfig","xp","coins","currentStreak","updatedAt","createdAt") VALUES
('demo-ana','ana@11cracks.com','$2b$10$Le.UOKO5ahvXXXNA9qDE6.ObIL9k/nBSMeHOHRhpoez2C4gLEnj/q','Ana Torres','ana10','JUGADOR'::"Role",'{"gender":"female","jersey":"#2563eb","shorts":"#f8fafc","hair":"long","hairColor":"#3b2f2f"}'::jsonb,1420,320,9,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('demo-diego','diego@11cracks.com','$2b$10$Le.UOKO5ahvXXXNA9qDE6.ObIL9k/nBSMeHOHRhpoez2C4gLEnj/q','Diego Ramírez','diego7','JUGADOR'::"Role",'{"gender":"male","jersey":"#dc2626","shorts":"#111827","hair":"spiky"}'::jsonb,980,210,5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
('demo-lucas','lucas@11cracks.com','$2b$10$Le.UOKO5ahvXXXNA9qDE6.ObIL9k/nBSMeHOHRhpoez2C4gLEnj/q','Lucas Gómez','lucas9','JUGADOR'::"Role",'{"gender":"male","jersey":"#16a34a","shorts":"#f8fafc","hair":"curly"}'::jsonb,610,140,3,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Team" ("id","name","code","createdAt") VALUES
('demo-team','Demo FC','DEMOFC',CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "TeamMember" ("id","teamId","userId","role","joinedAt") VALUES
('demo-tm-ana','demo-team','demo-ana','PLAYER'::"TeamRole",CURRENT_TIMESTAMP),
('demo-tm-diego','demo-team','demo-diego','PLAYER'::"TeamRole",CURRENT_TIMESTAMP),
('demo-tm-lucas','demo-team','demo-lucas','PLAYER'::"TeamRole",CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
