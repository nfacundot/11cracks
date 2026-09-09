export type GameCategory = "OIDO" | "GOL" | "LETRAS" | "ALIMENTACION";

export const GAME_CATEGORIES: GameCategory[] = ["OIDO", "GOL", "LETRAS", "ALIMENTACION"];

export const GAME_CATEGORY_META: Record<GameCategory, { emoji: string; color: string; label: string }> = {
  OIDO: { emoji: "👂", color: "#22c55e", label: "Oído" },
  GOL: { emoji: "⚽", color: "#3b82f6", label: "Gol" },
  LETRAS: { emoji: "🧩", color: "#a855f7", label: "Letras" },
  ALIMENTACION: { emoji: "🍎", color: "#f97316", label: "Alimentación" },
};