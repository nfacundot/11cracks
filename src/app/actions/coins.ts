"use server";
import { requireSection } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { postCoinCorrection } from "@/lib/coins/service";
import type { CoinEngineDecision } from "@/lib/coins/service";

type CoinMutationResult = CoinEngineDecision & { ledgerId?: string; droppedAsDuplicate?: boolean };

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${name} es obligatorio.`);
  return value.trim();
}

export async function postCoinCorrectionAction(formData: FormData): Promise<CoinMutationResult> {
  const user = await requireSection("ADMIN");
  const playerId = requireString(formData.get("playerId"), "Jugador");
  const clubId = requireString(formData.get("clubId"), "Club");
  const coinDelta = Number(formData.get("coinDelta"));
  if (!Number.isInteger(coinDelta) || coinDelta === 0) throw new Error("El delta debe ser un entero distinto de cero.");
  const notes = (formData.get("notes") as string) || null;

  const result = await postCoinCorrection({ actor: user, playerId, clubId, coinDelta, notes });
  revalidatePath("/admin/coins");
  return result;
}