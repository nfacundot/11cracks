"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";

export type LetrasState = { error?: string; success?: string } | undefined;

function parseLetters(raw: string): string[] | null {
  const parsed = raw
    .split(/[\s,]+/)
    .map((letter) => letter.trim().toUpperCase())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : null;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "Inglés (en-US)",
  pt: "Portugués (pt-BR)",
  es: "Español (es-ES)",
};

export async function saveLetrasCrackWord(prev: LetrasState, formData: FormData): Promise<LetrasState> {
  await requireStaff();

  const id = String(formData.get("id") || "").trim();
  const gameId = String(formData.get("gameId") || "").trim() || null;
  const word = String(formData.get("word") || "").trim();
  const meaning = String(formData.get("meaning") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  const language = String(formData.get("language") || "en").trim();
  const letters = parseLetters(String(formData.get("letters") || ""));

  if (!word) return { error: "Escribe la palabra a construir" };
  if (word.length > 60) return { error: "La palabra es demasiado larga" };
  if (!meaning) return { error: "Escribe el significado" };
  if (!imageUrl) return { error: "Agrega la imagen del objeto" };
  if (!["en", "pt", "es"].includes(language)) {
    return { error: "Idioma inválido" };
  }
  if (gameId) {
    const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true } });
    if (!game) return { error: "El juego seleccionado no existe" };
  }
  if (!letters) {
    return { error: "Escribe las letras disponibles separadas por comas" };
  }

  const correctOrder = word.toUpperCase().replace(/\s+/g, "");
  for (const letter of correctOrder) {
    if (!letters.includes(letter)) {
      return { error: `A las letras disponibles les falta la letra "${letter}" para construir "${correctOrder}"` };
    }
  }

  if (id) {
    await prisma.letrasCrackWord.update({
      where: { id },
      data: { gameId, word, meaning, imageUrl, language, letters },
    });
  } else {
    await prisma.letrasCrackWord.create({
      data: {
        gameId,
        word,
        meaning,
        imageUrl,
        language,
        letters,
        order: await prisma.letrasCrackWord.count(),
      },
    });
  }

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: `Palabra "${word}" guardada (${LANGUAGE_LABELS[language]})` };
}

export async function deleteLetrasCrackWord(
  wordId: string
): Promise<{ error?: string; success?: string }> {
  await requireStaff();

  await prisma.letrasCrackWord.delete({ where: { id: wordId } });

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: "Palabra eliminada" };
}

export async function toggleLetrasCrackWord(
  wordId: string,
  active: boolean
): Promise<{ error?: string; success?: string }> {
  await requireStaff();

  const current = await prisma.letrasCrackWord.count({
    where: { active: true, id: { not: wordId } },
  });
  if (!active && current === 0) {
    return { error: "Debe quedar al menos una palabra activa" };
  }

  await prisma.letrasCrackWord.update({
    where: { id: wordId },
    data: { active },
  });

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: active ? "Palabra activada" : "Palabra desactivada" };
}