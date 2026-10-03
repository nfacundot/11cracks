"use client";

import { useSyncExternalStore } from "react";

type Listener = () => void;

let value = 100;
let hydrated = false;
let sleepRequested = false;
const listeners = new Set<Listener>();

export function subscribeEnergy(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function energySnapshot() {
  return value;
}

export function energyServerSnapshot() {
  return 100;
}

export function getEnergy() {
  return value;
}

export function setEnergy(next: number, persist = true) {
  const clamped = Math.max(0, Math.min(100, Math.round(next * 10) / 10));
  if (clamped === value) return;
  value = clamped;
  listeners.forEach((listener) => listener());
  if (persist) {
    void fetch("/api/energy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ energy: clamped }),
    }).catch(() => {
      /* se reintenta luego */
    });
  }
}

export function hydrateEnergy(initial: number) {
  if (hydrated) return;
  hydrated = true;
  value = Math.max(0, Math.min(100, Math.round(initial * 10) / 10));
  listeners.forEach((listener) => listener());
}

export function requestSleep() {
  sleepRequested = true;
}

export function consumeSleepRequest() {
  const requested = sleepRequested;
  sleepRequested = false;
  return requested;
}

export function useEnergy() {
  return useSyncExternalStore(subscribeEnergy, energySnapshot, energyServerSnapshot);
}
