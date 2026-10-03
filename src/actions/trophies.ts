"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/auth";
import { isTrophyMetric } from "@/lib/trophies";

export type TrophyState = { error?: string; success?: string } | undefined;

function readTrophy(formData: FormData) {
  const target = Number(formData.get("target") || 1);
  const order = Number(formData.get("order") || 0);
  return {
    name: String(formData.get("name") || "").trim().slice(0, 60),
    subtitle: String(formData.get("subtitle") || "").trim().slice(0, 80),
    description: String(formData.get("description") || "").trim().slice(0, 160),
    icon: String(formData.get("icon") || "").trim().slice(0, 8) || "🏆",
    metric: String(formData.get("metric") || ""),
    target: Number.isInteger(target) ? target : 1,
    order: Number.isFinite(order) ? Math.trunc(order) : 0,
    active: formData.get("active") !== null,
  };
}

function validate(data: ReturnType<typeof readTrophy>): string | null {
  if (data.name.length < 2) return "El nombre debe tener al menos 2 caracteres";
  if (!isTrophyMetric(data.metric)) return "Selecciona una métrica válida";
  if (data.target < 1 || data.target > 1000000) return "La meta debe ser un entero positivo";
  return null;
}

export async function createTrophy(_prev: TrophyState, formData: FormData): Promise<TrophyState> {
  await requireSection("ADMIN");
  const data = readTrophy(formData);
  const error = validate(data);
  if (error) return { error };

  await prisma.trophy.create({ data });
  revalidatePath("/admin/trofeos");
  return { success: "Trofeo creado" };
}

export async function updateTrophy(formData: FormData): Promise<void> {
  await requireSection("ADMIN");
  const id = String(formData.get("id") || "");
  if (!id) return;
  const data = readTrophy(formData);
  if (validate(data)) return;

  await prisma.trophy.update({ where: { id }, data });
  revalidatePath("/admin/trofeos");
}

export async function toggleTrophyActive(formData: FormData): Promise<void> {
  await requireSection("ADMIN");
  const id = String(formData.get("id") || "");
  if (!id) return;
  const active = formData.get("active") === "1";
  await prisma.trophy.update({ where: { id }, data: { active } });
  revalidatePath("/admin/trofeos");
}

export async function deleteTrophy(formData: FormData): Promise<void> {
  await requireSection("ADMIN");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.trophy.delete({ where: { id } });
  revalidatePath("/admin/trofeos");
}
