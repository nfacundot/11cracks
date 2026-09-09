"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";

export type OidoState = { error?: string; success?: string } | undefined;

type OidoOptionInput = {
  id?: string;
  label: string;
  imageUrl: string;
  isCorrect: boolean;
};

function parseOptions(raw: string): OidoOptionInput[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((o: Record<string, unknown>) => ({
      id: typeof o.id === "string" ? o.id : undefined,
      label: String(o.label ?? "").trim(),
      imageUrl: String(o.imageUrl ?? "").trim(),
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

export async function saveOidoWord(prev: OidoState, formData: FormData): Promise<OidoState> {
  await requireStaff();

  const id = String(formData.get("id") || "").trim();
  const gameId = String(formData.get("gameId") || "").trim() || null;
  const word = String(formData.get("word") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const language = String(formData.get("language") || "en").trim();
  const options = parseOptions(String(formData.get("options") || "[]"));

  if (!word) return { error: "Escribe la palabra a pronunciar" };
  if (word.length > 60) return { error: "La palabra es demasiado larga" };
  if (!["en", "pt", "es"].includes(language)) {
    return { error: "Idioma inválido" };
  }
  if (gameId) {
    const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true } });
    if (!game) return { error: "El juego seleccionado no existe" };
  }
  if (!options || options.length < 2) {
    return { error: "Cada palabra necesita al menos 2 opciones" };
  }
  if (options.some((o) => !o.label || !o.imageUrl)) {
    return { error: "Cada opción necesita una etiqueta y una imagen" };
  }
  if (!options.some((o) => o.isCorrect)) {
    return { error: "Marca al menos una opción como correcta" };
  }

  if (id) {
    await prisma.oidoCrackWord.update({
      where: { id },
      data: {
        gameId,
        word,
        label: label || null,
        language,
        options: {
          deleteMany: {},
          create: options.map((o, index) => ({
            label: o.label,
            imageUrl: o.imageUrl,
            isCorrect: o.isCorrect,
            order: index,
          })),
        },
      },
    });
  } else {
    await prisma.oidoCrackWord.create({
      data: {
        gameId,
        word,
        label: label || null,
        language,
        order: await prisma.oidoCrackWord.count(),
        options: {
          create: options.map((o, index) => ({
            label: o.label,
            imageUrl: o.imageUrl,
            isCorrect: o.isCorrect,
            order: index,
          })),
        },
      },
    });
  }

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: word === "" ? "" : `Palabra "${word}" guardada (${LANGUAGE_LABELS[language]})` };
}

export async function deleteOidoWord(wordId: string): Promise<{ error?: string; success?: string }> {
  await requireStaff();

  await prisma.oidoCrackWord.delete({ where: { id: wordId } });

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: "Palabra eliminada" };
}

export async function toggleOidoWord(
  wordId: string,
  active: boolean
): Promise<{ error?: string; success?: string }> {
  await requireStaff();

  const current = await prisma.oidoCrackWord.count({
    where: { active: true, id: { not: wordId } },
  });
  if (!active && current === 0) {
    return { error: "Debe quedar al menos una palabra activa" };
  }

  await prisma.oidoCrackWord.update({
    where: { id: wordId },
    data: { active },
  });

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: active ? "Palabra activada" : "Palabra desactivada" };
}