-- Idioma de la lección (TTS y reconocimiento) para lecciones de Habla y Escribe.
ALTER TABLE "Lesson" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'es';
