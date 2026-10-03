export type NeedKey = "oral" | "hygiene" | "hunger" | "thirst" | "bladder";

export const NEED_KEYS: NeedKey[] = ["oral", "hygiene", "hunger", "thirst", "bladder"];

export const NEED_META: Record<NeedKey, { label: string; emoji: string }> = {
  oral: { label: "Higiene bucal", emoji: "🦷" },
  hygiene: { label: "Higiene personal", emoji: "🚿" },
  hunger: { label: "Hambre", emoji: "🍔" },
  thirst: { label: "Sed", emoji: "💧" },
  bladder: { label: "Vejiga", emoji: "🚽" },
};
