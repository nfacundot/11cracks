"use client";

import { useEffect, useState } from "react";
import { furnitureDef } from "@/lib/room";
import { INVENTORY_SIZE, type InventorySlot } from "@/lib/inventory";

export default function InventoryScreen() {
  const [slots, setSlots] = useState<InventorySlot[]>(() => Array.from({ length: INVENTORY_SIZE }, () => null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/inventory", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("bad"))))
      .then((data: { slots: InventorySlot[] }) => {
        if (active) setSlots(data.slots);
      })
      .catch(() => {
        /* sin conexión */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = (next: InventorySlot[]) => {
    setSlots(next);
    void fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: next }),
    }).catch(() => {
      /* se reintenta luego */
    });
  };

  const removeAt = (index: number) => {
    const slot = slots[index];
    if (!slot) return;
    const next = [...slots];
    next[index] = slot.qty > 1 ? { type: slot.type, qty: slot.qty - 1 } : null;
    save(next);
  };

  if (loading) {
    return <div className="goal50-text-dim grid h-full place-items-center p-6 text-sm">Cargando inventario…</div>;
  }

  return (
    <div className="no-scrollbar grid h-full place-items-center overflow-y-auto p-6">
      <div className="goal50-glass w-full max-w-[460px] rounded-3xl border p-5">
        <p className="goal50-text-dim text-[10px] font-bold uppercase tracking-[0.16em]">Inventario · 4×4</p>
        <h1 className="goal50-text mt-1 text-xl font-black">Tu inventario</h1>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {slots.map((slot, index) => (
            <button
              key={index}
              type="button"
              onClick={() => removeAt(index)}
              title={slot ? `${furnitureDef(slot.type).label} ×${slot.qty} (quitar)` : "Vacío"}
              className="goal50-tile flex aspect-square flex-col items-center justify-center gap-0.5 rounded-2xl"
            >
              {slot ? (
                <>
                  <span className="text-xl">{furnitureDef(slot.type).emoji}</span>
                  <span className="text-[10px] font-bold">×{slot.qty}</span>
                </>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
