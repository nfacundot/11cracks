"use client";

import { useSyncExternalStore } from "react";
import { NEED_KEYS, type NeedKey } from "@/lib/needs-meta";

export { NEED_KEYS, NEED_META } from "@/lib/needs-meta";
export type { NeedKey } from "@/lib/needs-meta";

type Values = Record<NeedKey, number>;

const defaults: Values = { oral: 100, hygiene: 100, hunger: 100, thirst: 100, bladder: 100 };

let values: Values = { ...defaults };
let hydrated = false;
let snapshot: Values = { ...values };
const listeners = new Set<() => void>();

function emit() {
  snapshot = { ...values };
  listeners.forEach((listener) => listener());
}

export function subscribeNeeds(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function needsSnapshot() {
  return snapshot;
}

export function needsServerSnapshot() {
  return defaults;
}

export function getNeed(key: NeedKey) {
  return values[key];
}

export function setNeed(key: NeedKey, value: number, persist = true) {
  const next = Math.max(0, Math.min(100, Math.round(value * 10) / 10));
  if (next === values[key]) return;
  values = { ...values, [key]: next };
  emit();
  if (persist) {
    void fetch("/api/needs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next }),
    }).catch(() => {
      /* se reintenta luego */
    });
  }
}

export function hydrateNeeds(initial: Partial<Record<NeedKey, number>>) {
  if (hydrated) return;
  hydrated = true;
  const next: Values = { ...defaults };
  for (const key of NEED_KEYS) {
    const value = initial?.[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      next[key] = Math.max(0, Math.min(100, Math.round(value * 10) / 10));
    }
  }
  values = next;
  emit();
}

export function useNeeds() {
  return useSyncExternalStore(subscribeNeeds, needsSnapshot, needsServerSnapshot);
}
