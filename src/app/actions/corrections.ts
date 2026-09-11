"use server";
import { requireSection } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { requestCorrection, reviewCorrection, applyCorrection } from "@/lib/corrections/service";

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} es obligatorio.`);
  return value.trim();
}

export async function requestCoinCorrectionAction(formData: FormData) {
  const user = await requireSection("ADMIN");
  const entityId = requireString(formData.get("entityId"), "Movimiento de monedas");
  const coinDelta = Number(formData.get("coinDelta"));
  if (!Number.isInteger(coinDelta)) throw new Error("El delta solicitado debe ser un entero.");
  const reason = requireString(formData.get("reason"), "Motivo");

  const result = await requestCorrection({
    actor: user,
    entityType: "coin_ledger",
    entityId,
    fieldName: "coinDelta",
    requestedValue: { coinDelta },
    reason,
  });
  revalidatePath("/admin/corrections");
  return result;
}

export async function reviewCorrectionAction(formData: FormData) {
  const user = await requireSection("ADMIN");
  const correctionId = requireString(formData.get("correctionId"), "Corrección");
  const approve = formData.get("approve") === "1";
  const result = await reviewCorrection({ actor: user, correctionId, approve });
  revalidatePath("/admin/corrections");
  return result;
}

export async function applyCorrectionAction(formData: FormData) {
  const user = await requireSection("ADMIN");
  const correctionId = requireString(formData.get("correctionId"), "Corrección");
  const result = await applyCorrection({ actor: user, correctionId });
  revalidatePath("/admin/corrections");
  revalidatePath("/admin/coins");
  return result;
}