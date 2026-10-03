"use client";

let target: {
  title: string;
  players: { id: string; name: string; avatarUrl: string | null }[];
  positions: Record<string, { x: number; y: number }>;
  meId: string;
} | null = null;

export type CanchaTarget = NonNullable<typeof target>;

export function setCanchaTarget(value: CanchaTarget | null) {
  target = value;
}

export function getCanchaTarget() {
  return target;
}
