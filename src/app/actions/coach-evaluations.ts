"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/auth";
import { createEvaluationDraft, publishEvaluation } from "@/lib/evaluations/service";
import { isRubricLevel, type RubricLevel } from "@/domain/evaluations/rubric";

function requiredText(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`El campo ${field} es obligatorio.`);
  return value;
}

function optionalText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value.length > 0 ? value : null;
}

function parseDate(formData: FormData, field: string): Date {
  const value = requiredText(formData, field);
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`Fecha inválida en ${field}.`);
  return date;
}

function parseItems(formData: FormData): { dimensionKey: string; rubricLevel: RubricLevel }[] {
  const raw = String(formData.get("items") ?? "[]").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("El detalle de dimensiones no es JSON válido.");
  }
  if (!Array.isArray(parsed)) throw new Error("El detalle de dimensiones debe ser una lista.");
  const items: { dimensionKey: string; rubricLevel: RubricLevel }[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) throw new Error("Item de evaluación no válido.");
    const { dimensionKey, rubricLevel } = entry as { dimensionKey?: unknown; rubricLevel?: unknown };
    if (typeof dimensionKey !== "string" || !dimensionKey) throw new Error("Item sin dimensionKey.");
    if (typeof rubricLevel !== "string" || !isRubricLevel(rubricLevel)) {
      throw new Error(`Nivel de rúbrica no válido para ${dimensionKey}.`);
    }
    items.push({ dimensionKey, rubricLevel });
  }
  return items;
}

export async function createCoachEvaluationAction(formData: FormData) {
  const actor = await requireSection("ENTRENADOR");
  const result = await createEvaluationDraft({
    actor,
    clubId: requiredText(formData, "clubId"),
    playerId: requiredText(formData, "playerId"),
    periodStart: parseDate(formData, "periodStart"),
    periodEnd: parseDate(formData, "periodEnd"),
    sessionId: optionalText(formData, "sessionId"),
    notes: optionalText(formData, "notes"),
    supersedesEvaluationId: optionalText(formData, "supersedesEvaluationId"),
    items: parseItems(formData),
  });
  revalidatePath("/coach/evaluaciones");
  return result;
}

export async function publishCoachEvaluationAction(formData: FormData) {
  const actor = await requireSection("ENTRENADOR");
  const result = await publishEvaluation({
    actor,
    evaluationId: requiredText(formData, "evaluationId"),
  });
  revalidatePath("/coach/evaluaciones");
  return result;
}

export async function createCorrectiveEvaluationAction(formData: FormData) {
  const actor = await requireSection("ENTRENADOR");
  const originalId = requiredText(formData, "supersedesEvaluationId");
  const items = parseItems(formData);
  const result = await createEvaluationDraft({
    actor,
    clubId: requiredText(formData, "clubId"),
    playerId: requiredText(formData, "playerId"),
    periodStart: parseDate(formData, "periodStart"),
    periodEnd: parseDate(formData, "periodEnd"),
    sessionId: optionalText(formData, "sessionId"),
    notes: optionalText(formData, "notes"),
    supersedesEvaluationId: originalId,
    items,
  });
  revalidatePath("/coach/evaluaciones");
  return result;
}