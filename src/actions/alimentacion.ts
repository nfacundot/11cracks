"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type AlimentacionState = {
  success?: string;
  error?: string;
};

export async function saveAlimentacionWord(
  prev: AlimentacionState | undefined,
  formData: FormData
): Promise<AlimentacionState> {
  try {
    const id = formData.get("id") as string;
    const gameId = formData.get("gameId") as string;
    const name = formData.get("name") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const audioUrl = (formData.get("audioUrl") as string) || null;
    const useTts = formData.get("useTts") === "true";
    const ttsVoice = (formData.get("ttsVoice") as string) || "female";
    const isHealthy = formData.get("isHealthy") === "true";
    const language = formData.get("language") as string;
    const active = formData.get("active") === "true";
    const order = parseInt(formData.get("order") as string) || 0;

    if (!gameId || !name || !imageUrl) {
      return { error: "Faltan campos obligatorios: gameId, nombre, imagen" };
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) return { error: "Juego no encontrado" };

    if (id) {
      await prisma.alimentacionWord.update({
        where: { id },
        data: { name, imageUrl, audioUrl, useTts, ttsVoice, isHealthy, language, active, order },
      });
      return { success: "Alimento actualizado" };
    } else {
      await prisma.alimentacionWord.create({
        data: { gameId, name, imageUrl, audioUrl, useTts, ttsVoice, isHealthy, language, active, order },
      });
      return { success: "Alimento creado" };
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error al guardar";
    return { error: message };
  } finally {
    revalidatePath("/admin/settings/lecciones", "layout");
    revalidatePath("/jugador/neurocracks", "layout");
  }
}

export async function deleteAlimentacionWord(
  prev: AlimentacionState | undefined,
  formData: FormData
): Promise<AlimentacionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "ID requerido" };
    await prisma.alimentacionWord.delete({ where: { id } });
    return { success: "Alimento eliminado" };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error al eliminar";
    return { error: message };
  } finally {
    revalidatePath("/admin/settings/lecciones", "layout");
    revalidatePath("/jugador/neurocracks", "layout");
  }
}

export async function toggleAlimentacionWord(
  prev: AlimentacionState | undefined,
  formData: FormData
): Promise<AlimentacionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "ID requerido" };
    const word = await prisma.alimentacionWord.findUnique({ where: { id } });
    if (!word) return { error: "Alimento no encontrado" };
    await prisma.alimentacionWord.update({
      where: { id },
      data: { active: !word.active },
    });
    return { success: word.active ? "Alimento desactivado" : "Alimento activado" };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error al cambiar estado";
    return { error: message };
  } finally {
    revalidatePath("/admin/settings/lecciones", "layout");
    revalidatePath("/jugador/neurocracks", "layout");
  }
}