"use server";

import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/auth";
import {
  cancelPetBatch,
  createPetBatch,
  createPetContribution,
  dispatchPetBatch,
  reconcilePetBatch,
  settlePetBatch,
  weighPetBatch,
} from "@/lib/pet/service";

function requiredText(formData: FormData, field: string): string {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) throw new Error(`El campo ${field} es obligatorio.`);
  return value;
}

function optionalText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value.length > 0 ? value : null;
}

function parseDate(formData: FormData, field: string): Date | null {
  const value = optionalText(formData, field);
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`Fecha inválida en ${field}.`);
  return date;
}

function parseNumber(formData: FormData, field: string, required: boolean): number | null {
  const value = String(formData.get(field) ?? "").trim();
  if (!value) {
    if (required) throw new Error(`El campo ${field} es obligatorio.`);
    return null;
  }
  const number = Number(value);
  if (Number.isNaN(number)) throw new Error(`Valor numérico inválido en ${field}.`);
  return number;
}

function parseIds(formData: FormData, field: string): string[] {
  const raw = String(formData.get(field) ?? "").trim();
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`El campo ${field} no es JSON válido.`);
  }
  if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === "string")) {
    throw new Error(`El campo ${field} debe ser una lista de IDs.`);
  }
  return parsed as string[];
}

export async function createPetContributionAction(formData: FormData) {
  const actor = await requireSection("ADMIN");
  const recordedAt = parseDate(formData, "recordedAt");
  if (!recordedAt) throw new Error("Fecha de recolección obligatoria.");
  const result = await createPetContribution({
    actor,
    clubId: requiredText(formData, "clubId"),
    playerId: optionalText(formData, "playerId"),
    sessionId: optionalText(formData, "sessionId"),
    recordedAt,
    bottlesCount: Number(requiredText(formData, "bottlesCount")),
    estimatedKg: parseNumber(formData, "estimatedKg", false),
    notes: optionalText(formData, "notes"),
  });
  revalidatePath("/admin/pet");
  return result;
}

export async function createPetBatchAction(formData: FormData) {
  const actor = await requireSection("ADMIN");
  const result = await createPetBatch({
    actor,
    clubId: requiredText(formData, "clubId"),
    batchCode: requiredText(formData, "batchCode"),
    contributionIds: parseIds(formData, "contributionIds"),
  });
  revalidatePath("/admin/pet");
  return result;
}

export async function dispatchPetBatchAction(formData: FormData) {
  const actor = await requireSection("ADMIN");
  const dispatchDate = parseDate(formData, "dispatchDate");
  if (!dispatchDate) throw new Error("Fecha de despacho obligatoria.");
  const bottlesSent = parseNumber(formData, "bottlesSent", true);
  if (bottlesSent === null) throw new Error("Botellas despachadas obligatorias.");
  const result = await dispatchPetBatch({
    actor,
    clubId: requiredText(formData, "clubId"),
    batchId: requiredText(formData, "batchId"),
    dispatchDate,
    bottlesSent,
    processorName: optionalText(formData, "processorName"),
  });
  revalidatePath("/admin/pet");
  return result;
}

export async function weighPetBatchAction(formData: FormData) {
  const actor = await requireSection("ADMIN");
  const receivedAt = parseDate(formData, "receivedAt");
  if (!receivedAt) throw new Error("Fecha de recepción obligatoria.");
  const realKg = parseNumber(formData, "realKg", true);
  if (realKg === null) throw new Error("Peso real obligatorio.");
  const result = await weighPetBatch({
    actor,
    clubId: requiredText(formData, "clubId"),
    batchId: requiredText(formData, "batchId"),
    receivedAt,
    realKg,
    processorName: requiredText(formData, "processorName"),
    weighingDocumentUrl: requiredText(formData, "weighingDocumentUrl"),
  });
  revalidatePath("/admin/pet");
  return result;
}

export async function settlePetBatchAction(formData: FormData) {
  const actor = await requireSection("ADMIN");
  const copPaid = parseNumber(formData, "copPaid", true);
  if (copPaid === null) throw new Error("COP pagados obligatorios.");
  const result = await settlePetBatch({
    actor,
    clubId: requiredText(formData, "clubId"),
    batchId: requiredText(formData, "batchId"),
    copPaid,
    settlementDocumentUrl: requiredText(formData, "settlementDocumentUrl"),
  });
  revalidatePath("/admin/pet");
  return result;
}

export async function reconcilePetBatchAction(formData: FormData) {
  const actor = await requireSection("ADMIN");
  const result = await reconcilePetBatch({
    actor,
    clubId: requiredText(formData, "clubId"),
    batchId: requiredText(formData, "batchId"),
    paymentReference: requiredText(formData, "paymentReference"),
  });
  revalidatePath("/admin/pet");
  return result;
}

export async function cancelPetBatchAction(formData: FormData) {
  const actor = await requireSection("ADMIN");
  const result = await cancelPetBatch({
    actor,
    clubId: requiredText(formData, "clubId"),
    batchId: requiredText(formData, "batchId"),
  });
  revalidatePath("/admin/pet");
  return result;
}