"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";

export type GolState = { error?: string; success?: string } | undefined;

type GolOptionInput = {
  id?: string;
  label: string;
  isCorrect: boolean;
};

function parseOptions(raw: string): GolOptionInput[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((o: Record<string, unknown>) => ({
      id: typeof o.id === "string" ? o.id : undefined,
      label: String(o.label ?? "").trim(),
      isCorrect: Boolean(o.isCorrect),
    }));
  } catch {
    return null;
  }
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "Inglés (en-US)",
  pt: "Portugués (pt-BR)",
  es: "Español (es-ES)",
};

export async function saveGolPalabraWord(prev: GolState, formData: FormData): Promise<GolState> {
  await requireStaff();

  const id = String(formData.get("id") || "").trim();
  const gameId = String(formData.get("gameId") || "").trim() || null;
  const word = String(formData.get("word") || "").trim();
  const meaning = String(formData.get("meaning") || "").trim();
  const language = String(formData.get("language") || "en").trim();
  const options = parseOptions(String(formData.get("options") || "[]"));

  if (!word) return { error: "Escribe la palabra a pronunciar" };
  if (word.length > 60) return { error: "La palabra es demasiado larga" };
  if (!meaning) return { error: "Escribe el significado correcto" };
  if (!["en", "pt", "es"].includes(language)) {
    return { error: "Idioma inválido" };
  }
  if (gameId) {
    const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true } });
    if (!game) return { error: "El juego seleccionado no existe" };
  }
  if (!options || options.length < 2) {
    return { error: "Cada palabra necesita al menos 2 opciones de significado" };
  }
  if (options.some((o) => !o.label)) {
    return { error: "Cada opción necesita una etiqueta" };
  }
  if (!options.some((o) => o.isCorrect)) {
    return { error: "Marca al menos una opción como correcta" };
  }

  if (id) {
    await prisma.golPalabraWord.update({
      where: { id },
      data: {
        gameId,
        word,
        meaning,
        language,
        options: {
          deleteMany: {},
          create: options.map((o, index) => ({
            label: o.label,
            isCorrect: o.isCorrect,
            order: index,
          })),
        },
      },
    });
  } else {
    await prisma.golPalabraWord.create({
      data: {
        gameId,
        word,
        meaning,
        language,
        order: await prisma.golPalabraWord.count(),
        options: {
          create: options.map((o, index) => ({
            label: o.label,
            isCorrect: o.isCorrect,
            order: index,
          })),
        },
      },
    });
  }

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: `Palabra "${word}" guardada (${LANGUAGE_LABELS[language]})` };
}

export async function deleteGolPalabraWord(
  wordId: string
): Promise<{ error?: string; success?: string }> {
  await requireStaff();

  await prisma.golPalabraWord.delete({ where: { id: wordId } });

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: "Palabra eliminada" };
}

export async function toggleGolPalabraWord(
  wordId: string,
  active: boolean
): Promise<{ error?: string; success?: string }> {
  await requireStaff();

  const current = await prisma.golPalabraWord.count({
    where: { active: true, id: { not: wordId } },
  });
  if (!active && current === 0) {
    return { error: "Debe quedar al menos una palabra activa" };
  }

  await prisma.golPalabraWord.update({
    where: { id: wordId },
    data: { active },
  });

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: active ? "Palabra activada" : "Palabra desactivada" };
}