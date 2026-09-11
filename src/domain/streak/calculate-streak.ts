export interface StreakComponentPct {
  attendance: number | null;
  neurocracks: number | null;
  challenge: number | null;
  pet: number | null;
  validation: number | null;
}

export interface StreakWeights {
  attendance: number;
  neurocracks: number;
  challenge: number;
  pet: number;
  validation: number;
}

export interface StreakManualOverride {
  pet?: number | null;
  validation?: number | null;
  reason: string;
}

export interface CalculateStreakInput {
  components: StreakComponentPct;
  weights: StreakWeights;
  verifiedWeekThreshold: number | null;
  closePeriod: boolean;
  manualOverride?: StreakManualOverride | null;
}

export interface StreakResult {
  calculationStatus: "INCOMPLETE" | "PREVIEW" | "FINAL";
  score: number | null;
  components: StreakComponentPct;
  verifiedWeek: boolean | null;
  missing: (keyof StreakComponentPct)[];
  reason: string | null;
}

export const STREAK_COMPONENT_KEYS: (keyof StreakComponentPct)[] = [
  "attendance",
  "neurocracks",
  "challenge",
  "pet",
  "validation",
];

export const STREAK_OVERRIDABLE_KEYS = ["pet", "validation"] as const;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveComponents(input: CalculateStreakInput): {
  components: StreakComponentPct;
  overriddenKeys: (keyof StreakComponentPct)[];
} {
  const override = input.manualOverride;
  const overriddenKeys: (keyof StreakComponentPct)[] = [];
  const components: StreakComponentPct = { ...input.components };

  if (override) {
    for (const key of STREAK_OVERRIDABLE_KEYS) {
      if (override[key] !== undefined && components[key] === null) {
        components[key] = override[key] ?? null;
        overriddenKeys.push(key);
      }
    }
  }

  return { components, overriddenKeys };
}

export function calculateStreak(input: CalculateStreakInput): StreakResult {
  const { components, overriddenKeys } = resolveComponents(input);
  const missing = STREAK_COMPONENT_KEYS.filter((key) => components[key] === null);
  const weights = input.weights;

  const present = STREAK_COMPONENT_KEYS.filter((key) => components[key] !== null);
  const presentWeight = present.reduce((sum, key) => sum + (weights[key] ?? 0), 0);
  const hasWeight = presentWeight > 0;

  const weightedOnPresent = hasWeight
    ? round2(present.reduce((sum, key) => sum + ((components[key] ?? 0) * (weights[key] ?? 0)) / presentWeight, 0))
    : null;

  const weightedFull = round2(
    present.reduce((sum, key) => sum + ((components[key] ?? 0) * (weights[key] ?? 0)), 0)
  );

  let calculationStatus: StreakResult["calculationStatus"];
  let score: number | null;

  if (missing.length === 0) {
    calculationStatus = input.closePeriod ? "FINAL" : "PREVIEW";
    score = weightedFull;
  } else if (input.closePeriod && input.manualOverride && overriddenKeys.length > 0 && input.manualOverride.reason) {
    calculationStatus = "FINAL";
    score = weightedFull;
  } else if (input.closePeriod) {
    calculationStatus = "INCOMPLETE";
    score = null;
  } else {
    calculationStatus = "PREVIEW";
    score = weightedOnPresent;
  }

  const verifiedWeek =
    input.verifiedWeekThreshold !== null && score !== null
      ? score >= input.verifiedWeekThreshold
      : null;

  let reason: string | null = null;
  if (calculationStatus === "INCOMPLETE") {
    reason = `Faltan componentes: ${missing.join(", ")}. Sin override auditado no se produce un score FINAL.`;
  } else if (calculationStatus === "FINAL" && overriddenKeys.length > 0) {
    reason = `Cierre con override auditado para ${overriddenKeys.join(", ")}. ${input.manualOverride?.reason ?? ""}`.trim();
  }

  return {
    calculationStatus,
    score,
    components,
    verifiedWeek,
    missing,
    reason,
  };
}