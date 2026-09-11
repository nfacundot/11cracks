"use server";
import { requireSection } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createImportBatch, applyImportBatch, correctImportRow, type SupportedImportType } from "@/lib/imports/service";

function requireNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} es obligatorio.`);
  return value.trim();
}

export async function createImportBatchAction(formData: FormData) {
  const user = await requireSection("ADMIN");
  const clubId = (formData.get("clubId") as string) || null;
  const importType = requireNonEmptyString(formData.get("importType"), "Tipo de importación");
  const fileName = requireNonEmptyString(formData.get("fileName"), "Nombre de archivo");
  const fileText = requireNonEmptyString(formData.get("fileText"), "Contenido del archivo");

  const result = await createImportBatch({ actor: user, clubId, importType: importType as SupportedImportType, fileName, fileText });
  revalidatePath("/admin/import");
  return result;
}

export async function applyImportBatchAction(formData: FormData) {
  const user = await requireSection("ADMIN");
  const batchId = requireNonEmptyString(formData.get("batchId"), "Lote");
  const result = await applyImportBatch({ actor: user, batchId });
  revalidatePath("/admin/import");
  return result;
}

export async function correctImportRowAction(formData: FormData) {
  const user = await requireSection("ADMIN");
  const rowId = requireNonEmptyString(formData.get("rowId"), "Fila");
  const correctedDataRaw = requireNonEmptyString(formData.get("correctedData"), "Datos corregidos");

  let correctedData: Record<string, unknown>;
  try {
    correctedData = JSON.parse(correctedDataRaw);
    if (typeof correctedData !== "object" || correctedData === null) throw new Error();
  } catch {
    throw new Error("Datos corregidos deben ser JSON válido.");
  }

  await correctImportRow({ actor: user, rowId, correctedData });
  revalidatePath("/admin/import");
}