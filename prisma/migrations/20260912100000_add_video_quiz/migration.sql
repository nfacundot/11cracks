-- Permite asociar un cuestionario (preguntas/opciones) a un Video.
ALTER TABLE "Question"
  ALTER COLUMN "lessonId" DROP NOT NULL;

ALTER TABLE "Question"
  ADD COLUMN "videoId" TEXT;

ALTER TABLE "Question"
  ADD CONSTRAINT "Question_videoId_fkey"
  FOREIGN KEY ("videoId") REFERENCES "Video"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Question_videoId_order_idx" ON "Question"("videoId", "order");