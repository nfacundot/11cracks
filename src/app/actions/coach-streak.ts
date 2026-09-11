"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/auth";
import { recalculateStreakPeriodResult } from "@/lib/streak/service";

function requiredText(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`El campo ${field} es obligatorio.`);
  return value;
}

function parseDate(formData: FormData, field: string): Date {
  const value = requiredText(formData, field);
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`Fecha inválida en ${field}.`);
  return date;
}

export async function recalculateCoachPlayerStreakAction(formData: FormData) {
  const actor = await requireSection("ENTRENADOR");
  const result = await recalculateStreakPeriodResult({
    actor,
    clubId: requiredText(formData, "clubId"),
    playerId: requiredText(formData, "playerId"),
    periodStart: parseDate(formData, "periodStart"),
    periodEnd: parseDate(formData, "periodEnd"),
    closePeriod: false,
  });
  revalidatePath("/coach/racha");
  return result;
}