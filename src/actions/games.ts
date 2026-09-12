"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth";
import { GAME_CATEGORIES, GAME_CATEGORY_META, type GameCategory } from "@/lib/games";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type GameState = { error?: string; success?: string } | undefined;

export async function saveGame(prev: GameState, formData: FormData): Promise<GameState> {
  await requireStaff();

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const categoryValue = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const emoji = String(formData.get("emoji") || "").trim();
  const xpRewardRaw = Number(String(formData.get("xpReward") || "").trim());
  const xpReward = Number.isFinite(xpRewardRaw) ? Math.min(500, Math.max(0, Math.round(xpRewardRaw))) : 25;

  if (!name) return { error: "Escribe el nombre del juego" };
  if (name.length > 60) return { error: "El nombre es demasiado largo" };
  if (!GAME_CATEGORIES.includes(categoryValue as GameCategory)) {
    return { error: "Categoría inválida" };
  }
  const category = categoryValue as GameCategory;

  let slug = slugify(name);
  if (!slug) slug = "juego";
  const existing = await prisma.game.findMany({
    where: { slug: { startsWith: slug }, ...(id ? { id: { not: id } } : {}) },
    select: { slug: true },
  });
  const taken = new Set(existing.map((game) => game.slug));
  let uniqueSlug = slug;
  let counter = 2;
  while (taken.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter += 1;
  }

  const meta = GAME_CATEGORY_META[category];

  if (id) {
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.update({
        where: { id },
        data: {
          name,
          category,
          description: description || null,
          emoji: emoji || meta.emoji,
          active: true,
        },
      });
      await tx.lesson.updateMany({
        where: { gameId: game.id },
        data: {
          title: name,
          description: description || `Juego vinculado a la lección "${name}".`,
          emoji: emoji || meta.emoji,
          color: meta.color,
          type: "GAME",
          xpReward,
        },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      const game = await tx.game.create({
        data: {
          slug: uniqueSlug,
          name,
          category,
          description: description || null,
          emoji: emoji || meta.emoji,
          color: meta.color,
          active: true,
          order: await tx.game.count(),
        },
      });
      await tx.lesson.create({
        data: {
          title: name,
          description: description || `Juego vinculado a la lección "${name}".`,
          emoji: emoji || meta.emoji,
          color: meta.color,
          type: "GAME",
          xpReward,
          order: 100,
          gameId: game.id,
        },
      });
    });
  }

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: `Juego "${name}" guardado` };
}

export async function deleteGame(gameId: string): Promise<{ error?: string; success?: string }> {
  await requireStaff();

  await prisma.$transaction(async (tx) => {
    await tx.lesson.deleteMany({ where: { gameId } });
    await tx.game.delete({ where: { id: gameId } });
  });

  revalidatePath("/admin/settings/lecciones", "layout");
  revalidatePath("/jugador/neurocracks", "layout");
  return { success: "Juego eliminado" };
}