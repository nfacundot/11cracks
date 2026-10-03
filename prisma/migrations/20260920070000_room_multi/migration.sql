-- DropIndex
DROP INDEX "Room_userId_key";

-- CreateIndex
CREATE INDEX "Room_userId_idx" ON "Room"("userId");
