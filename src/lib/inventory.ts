import { FURNITURE_CATALOG, furnitureDef } from "@/lib/room";

export const INVENTORY_SIZE = 16;

export type InventorySlot = { type: string; qty: number } | null;

const IDS = new Set<string>(FURNITURE_CATALOG.map((def) => def.id));

export function parseInventory(value: unknown): InventorySlot[] {
  const slots: InventorySlot[] = Array.from({ length: INVENTORY_SIZE }, () => null);
  if (!Array.isArray(value)) return slots;
  for (let i = 0; i < INVENTORY_SIZE && i < value.length; i += 1) {
    const raw = value[i];
    if (!raw || typeof raw !== "object") continue;
    const slot = raw as Record<string, unknown>;
    if (typeof slot.type !== "string" || !IDS.has(slot.type)) continue;
    const qty = Number(slot.qty);
    slots[i] = { type: slot.type, qty: Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 1 };
  }
  return slots;
}

export function inventoryLabel(type: string) {
  return furnitureDef(type).label;
}
